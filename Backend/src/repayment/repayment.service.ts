import { Injectable, Logger, OnModuleInit, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FundingTransaction, TransactionStatus } from './funding-transaction.entity';
import { RepaymentSplitter } from './repayment-splitter';
import { HorizonListener, PaymentEvent } from './horizon-listener';
import { StellarClient } from '../stellar/stellar-client';

@Injectable()
export class RepaymentService implements OnModuleInit {
  private readonly logger = new Logger(RepaymentService.name);

  constructor(
    @InjectRepository(FundingTransaction)
    private readonly fundingTransactionRepository: Repository<FundingTransaction>,
    private readonly repaymentSplitter: RepaymentSplitter,
    @Inject(forwardRef(() => HorizonListener))
    private readonly horizonListener: HorizonListener,
    private readonly stellarClient: StellarClient,
  ) {}

  async onModuleInit() {
    this.logger.log('RepaymentService initialized');
  }

  async processRepayment(transactionId: string, paymentEvent: PaymentEvent): Promise<void> {
    this.logger.log(`Processing repayment for transaction ${transactionId}`);

    try {
      // Find the funding transaction
      const fundingTransaction = await this.fundingTransactionRepository.findOne({
        where: { id: transactionId },
        relations: ['invoice'],
      });

      if (!fundingTransaction) {
        this.logger.error(`Funding transaction ${transactionId} not found`);
        return;
      }

      if (fundingTransaction.status === TransactionStatus.REPAID) {
        this.logger.warn(`Transaction ${transactionId} is already marked as repaid`);
        return;
      }

      const repaymentAmount = parseFloat(paymentEvent.amount);

      // Validate the repayment amount
      const validation = this.repaymentSplitter.validateRepaymentAmount(
        fundingTransaction,
        repaymentAmount,
      );

      if (!validation.isValid) {
        this.logger.error(
          `Invalid repayment amount for transaction ${transactionId}: ${validation.reason}`
        );
        return;
      }

      // Calculate the split of funds
      const split = this.repaymentSplitter.calculateSplit(
        fundingTransaction,
        repaymentAmount,
      );

      // Execute the fund distribution
      await this.executeFundDistribution(fundingTransaction, split, paymentEvent);

      // Update the funding transaction status
      await this.updateTransactionStatus(fundingTransaction, repaymentAmount, paymentEvent);

      this.logger.log(`Successfully processed repayment for transaction ${transactionId}`);

    } catch (error) {
      this.logger.error(`Error processing repayment for transaction ${transactionId}:`, error);
      throw error;
    }
  }

  private async executeFundDistribution(
    fundingTransaction: FundingTransaction,
    split: any,
    paymentEvent: PaymentEvent,
  ): Promise<void> {
    this.logger.log(
      `Executing fund distribution for transaction ${fundingTransaction.id}: ` +
      `Principal: ${split.principal}, Interest: ${split.interest}, Protocol Fee: ${split.protocolFee}`
    );

    try {
      // In a real implementation, this would interact with the CollateralEscrow contract
      // For now, we'll simulate the contract interaction
      
      const escrowContractId = fundingTransaction.escrowContractId;
      if (!escrowContractId) {
        throw new Error(`No escrow contract ID found for transaction ${fundingTransaction.id}`);
      }

      // Build and submit settlement transaction to CollateralEscrow contract
      const settlementTx = await this.buildSettlementTransaction(
        fundingTransaction,
        split,
        paymentEvent,
      );

      const settlementResult = await this.stellarClient.submitTransaction(settlementTx);
      
      // Wait for transaction finalization
      await this.stellarClient.waitForTransactionFinalization(settlementResult.hash);

      this.logger.log(
        `Successfully settled escrow contract ${escrowContractId} with transaction ${settlementResult.hash}`
      );

    } catch (error) {
      this.logger.error(`Failed to execute fund distribution for transaction ${fundingTransaction.id}:`, error);
      throw error;
    }
  }

  private async buildSettlementTransaction(
    fundingTransaction: FundingTransaction,
    split: any,
    paymentEvent: PaymentEvent,
  ): Promise<string> {
    // This would build the actual transaction to call the CollateralEscrow contract
    // For now, we'll return a placeholder
    
    this.logger.log(
      `Building settlement transaction for escrow contract ${fundingTransaction.escrowContractId}`
    );

    // In a real implementation, this would:
    // 1. Create a transaction that calls the CollateralEscrow contract's settle function
    // 2. Include the split amounts as parameters
    // 3. Sign with the protocol wallet key
    // 4. Return the signed XDR

    // Placeholder implementation
    return 'PLACEHOLDER_TRANSACTION_XDR';
  }

  private async updateTransactionStatus(
    fundingTransaction: FundingTransaction,
    repaymentAmount: number,
    paymentEvent: PaymentEvent,
  ): Promise<void> {
    const currentRepaidAmount = fundingTransaction.repaidAmount || 0;
    const newRepaidAmount = currentRepaidAmount + repaymentAmount;
    const totalAmount = fundingTransaction.totalAmount;

    // Determine if the transaction is fully repaid
    const isFullyRepaid = Math.abs(newRepaidAmount - totalAmount) < 0.000001;

    await this.fundingTransactionRepository.update(fundingTransaction.id, {
      repaidAmount: newRepaidAmount,
      repaymentTxHash: paymentEvent.transactionHash,
      status: isFullyRepaid ? TransactionStatus.REPAID : TransactionStatus.FUNDED,
      repaidAt: isFullyRepaid ? new Date() : fundingTransaction.repaidAt,
    });

    if (isFullyRepaid) {
      this.logger.log(
        `Transaction ${fundingTransaction.id} is fully repaid. Status updated to REPAID.`
      );
    } else {
      this.logger.log(
        `Transaction ${fundingTransaction.id} partially repaid. ` +
        `Repaid: ${newRepaidAmount}/${totalAmount}`
      );
    }
  }

  async getPendingRepayments(): Promise<FundingTransaction[]> {
    return this.fundingTransactionRepository.find({
      where: {
        status: TransactionStatus.FUNDED,
      },
      relations: ['invoice'],
    });
  }

  async getTransactionById(id: string): Promise<FundingTransaction | null> {
    return this.fundingTransactionRepository.findOne({
      where: { id },
      relations: ['invoice'],
    });
  }

  async getTransactionsByInvestor(investorId: string): Promise<FundingTransaction[]> {
    return this.fundingTransactionRepository.find({
      where: { investorId },
      relations: ['invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTransactionsByStatus(status: TransactionStatus): Promise<FundingTransaction[]> {
    return this.fundingTransactionRepository.find({
      where: { status },
      relations: ['invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async manualReconciliation(transactionId: string, repaymentAmount: number): Promise<void> {
    this.logger.log(`Manual reconciliation for transaction ${transactionId}: ${repaymentAmount}`);

    const fundingTransaction = await this.fundingTransactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!fundingTransaction) {
      throw new Error(`Funding transaction ${transactionId} not found`);
    }

    const validation = this.repaymentSplitter.validateRepaymentAmount(
      fundingTransaction,
      repaymentAmount,
    );

    if (!validation.isValid) {
      throw new Error(`Invalid repayment amount: ${validation.reason}`);
    }

    // Create a manual payment event
    const manualPaymentEvent: PaymentEvent = {
      id: `manual-${Date.now()}`,
      pagingToken: `manual-${Date.now()}`,
      amount: repaymentAmount.toString(),
      assetType: 'native',
      from: 'manual-reconciliation',
      to: fundingTransaction.protocolWalletAddress || '',
      memo: this.repaymentSplitter.generatePaymentMemo(fundingTransaction),
      memoType: 'text',
      timestamp: new Date(),
      transactionHash: `manual-${Date.now()}`,
    };

    await this.processRepayment(transactionId, manualPaymentEvent);
  }
}
