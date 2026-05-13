import { Injectable, Logger } from '@nestjs/common';
import { FundingTransaction, SplitType } from './funding-transaction.entity';

export interface SplitResult {
  principal: number;
  interest: number;
  protocolFee: number;
  total: number;
}

@Injectable()
export class RepaymentSplitter {
  private readonly logger = new Logger(RepaymentSplitter.name);

  calculateSplit(
    fundingTransaction: FundingTransaction,
    repaymentAmount: number,
  ): SplitResult {
    const { principalAmount, interestAmount, protocolFeeAmount, totalAmount } = fundingTransaction;

    // If repayment amount equals total amount, return original splits
    if (Math.abs(repaymentAmount - totalAmount) < 0.000001) {
      this.logger.log(`Full repayment detected for transaction ${fundingTransaction.id}`);
      return {
        principal: principalAmount,
        interest: interestAmount,
        protocolFee: protocolFeeAmount,
        total: totalAmount,
      };
    }

    // For partial repayments, calculate proportional splits
    const repaymentRatio = repaymentAmount / totalAmount;
    
    const principalSplit = Math.floor(principalAmount * repaymentRatio * 10000000) / 10000000;
    const interestSplit = Math.floor(interestAmount * repaymentRatio * 10000000) / 10000000;
    const protocolFeeSplit = Math.floor(protocolFeeAmount * repaymentRatio * 10000000) / 10000000;
    
    // Account for rounding errors
    const calculatedTotal = principalSplit + interestSplit + protocolFeeSplit;
    const roundingError = Math.floor((repaymentAmount - calculatedTotal) * 10000000) / 10000000;
    
    // Add rounding error to principal split
    const finalPrincipal = principalSplit + roundingError;

    this.logger.log(
      `Calculated split for transaction ${fundingTransaction.id}: ` +
      `Principal: ${finalPrincipal}, Interest: ${interestSplit}, Protocol Fee: ${protocolFeeSplit}`
    );

    return {
      principal: finalPrincipal,
      interest: interestSplit,
      protocolFee: protocolFeeSplit,
      total: repaymentAmount,
    };
  }

  validateRepaymentAmount(
    fundingTransaction: FundingTransaction,
    repaymentAmount: number,
  ): { isValid: boolean; reason?: string } {
    const { totalAmount, repaidAmount = 0 } = fundingTransaction;
    const remainingAmount = totalAmount - repaidAmount;

    if (repaymentAmount <= 0) {
      return {
        isValid: false,
        reason: 'Repayment amount must be greater than zero',
      };
    }

    if (repaymentAmount > remainingAmount + 0.000001) {
      return {
        isValid: false,
        reason: `Repayment amount (${repaymentAmount}) exceeds remaining amount (${remainingAmount})`,
      };
    }

    return { isValid: true };
  }

  getDestinationAddresses(splitType: SplitType, fundingTransaction: FundingTransaction): string {
    // This would typically come from configuration or contract data
    // For now, we'll use placeholder logic
    switch (splitType) {
      case SplitType.PRINCIPAL:
        return fundingTransaction.investorId;
      case SplitType.INTEREST:
        return fundingTransaction.investorId;
      case SplitType.PROTOCOL_FEE:
        return fundingTransaction.protocolWalletAddress || process.env.PROTOCOL_WALLET_ADDRESS;
      default:
        throw new Error(`Unknown split type: ${splitType}`);
    }
  }

  generatePaymentMemo(fundingTransaction: FundingTransaction): string {
    return `REPAY-${fundingTransaction.id}-${Date.now()}`;
  }
}
