export interface ScoringWeights {
  counterpartyReputation: number; // Weight for counterparty reputation (1-100)
  invoiceAmount: number; // Weight for invoice amount
  dueDateProximity: number; // Weight for due date proximity
  businessHistory: number; // Weight for business history in months
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  counterpartyReputation: 0.3, // 30% weight
  invoiceAmount: 0.25, // 25% weight
  dueDateProximity: 0.25, // 25% weight
  businessHistory: 0.2, // 20% weight
};

export const RISK_GRADE_THRESHOLDS = {
  A: 85, // Score >= 85 gets Grade A
  B: 70, // Score >= 70 gets Grade B
  C: 0,  // Score < 70 gets Grade C
};

export const RISK_PARAMETERS = {
  HIGH_INVOICE_AMOUNT_THRESHOLD: 100000, // Amount above which risk increases
  DUE_DATE_RISK_DAYS: 30, // Days from due date when risk starts increasing
  MIN_BUSINESS_HISTORY_MONTHS: 12, // Minimum months for good business history score
};
