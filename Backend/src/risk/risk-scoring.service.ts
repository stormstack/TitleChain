import { Injectable } from '@nestjs/common';
import { Invoice, RiskGrade } from '../invoices/invoice.entity';
import {
  DEFAULT_SCORING_WEIGHTS,
  RISK_GRADE_THRESHOLDS,
  RISK_PARAMETERS,
  ScoringWeights,
} from './scoring-weights.config';

export interface RiskScoreResult {
  score: number;
  grade: RiskGrade;
  breakdown: {
    counterpartyReputation: number;
    invoiceAmount: number;
    dueDateProximity: number;
    businessHistory: number;
  };
}

@Injectable()
export class RiskScoringService {
  private readonly weights: ScoringWeights;

  constructor() {
    this.weights = DEFAULT_SCORING_WEIGHTS;
  }

  calculateRiskScore(invoice: Invoice): RiskScoreResult {
    const counterpartyScore = this.calculateCounterpartyReputationScore(
      invoice.counterpartyReputation,
    );
    const amountScore = this.calculateInvoiceAmountScore(invoice.amount);
    const dueDateScore = this.calculateDueDateProximityScore(invoice.dueDate);
    const businessHistoryScore = this.calculateBusinessHistoryScore(
      invoice.businessHistoryMonths,
    );

    const totalScore =
      counterpartyScore * this.weights.counterpartyReputation +
      amountScore * this.weights.invoiceAmount +
      dueDateScore * this.weights.dueDateProximity +
      businessHistoryScore * this.weights.businessHistory;

    const grade = this.determineRiskGrade(totalScore);

    return {
      score: Math.round(totalScore * 100) / 100,
      grade,
      breakdown: {
        counterpartyReputation: counterpartyScore,
        invoiceAmount: amountScore,
        dueDateProximity: dueDateScore,
        businessHistory: businessHistoryScore,
      },
    };
  }

  private calculateCounterpartyReputationScore(reputation: number): number {
    if (!reputation || reputation < 0) return 50; // Default neutral score
    
    // Reputation is 1-100, normalize to 0-100 risk score
    // Higher reputation = lower risk = higher score
    return Math.min(100, Math.max(0, reputation));
  }

  private calculateInvoiceAmountScore(amount: number): number {
    if (!amount || amount <= 0) return 50; // Default neutral score
    
    // Higher amounts = higher risk = lower score
    if (amount <= RISK_PARAMETERS.HIGH_INVOICE_AMOUNT_THRESHOLD) {
      return 85; // Good score for normal amounts
    }
    
    // Exponential risk increase for high amounts
    const excessRatio = amount / RISK_PARAMETERS.HIGH_INVOICE_AMOUNT_THRESHOLD;
    return Math.max(20, 85 - (excessRatio - 1) * 30);
  }

  private calculateDueDateProximityScore(dueDate: Date): number {
    if (!dueDate) return 50; // Default neutral score
    
    const today = new Date();
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // More days until due = lower risk = higher score
    if (daysUntilDue > RISK_PARAMETERS.DUE_DATE_RISK_DAYS) {
      return 90; // Excellent score for distant due dates
    } else if (daysUntilDue > 0) {
      // Linear decrease as due date approaches
      return 50 + (daysUntilDue / RISK_PARAMETERS.DUE_DATE_RISK_DAYS) * 40;
    } else if (daysUntilDue === 0) {
      return 30; // Due today - high risk
    } else {
      // Overdue - very high risk
      return Math.max(10, 30 - Math.abs(daysUntilDue) * 2);
    }
  }

  private calculateBusinessHistoryScore(historyMonths: number): number {
    if (!historyMonths || historyMonths <= 0) return 30; // No history = high risk
    
    // More history = lower risk = higher score
    if (historyMonths >= RISK_PARAMETERS.MIN_BUSINESS_HISTORY_MONTHS * 3) {
      return 95; // Excellent history
    } else if (historyMonths >= RISK_PARAMETERS.MIN_BUSINESS_HISTORY_MONTHS) {
      // Linear scaling between minimum and 3x minimum
      const ratio = historyMonths / RISK_PARAMETERS.MIN_BUSINESS_HISTORY_MONTHS;
      return 60 + (ratio - 1) * 17.5;
    } else {
      // Below minimum threshold
      return 30 + (historyMonths / RISK_PARAMETERS.MIN_BUSINESS_HISTORY_MONTHS) * 30;
    }
  }

  private determineRiskGrade(score: number): RiskGrade {
    if (score >= RISK_GRADE_THRESHOLDS.A) {
      return RiskGrade.A;
    } else if (score >= RISK_GRADE_THRESHOLDS.B) {
      return RiskGrade.B;
    } else {
      return RiskGrade.C;
    }
  }
}
