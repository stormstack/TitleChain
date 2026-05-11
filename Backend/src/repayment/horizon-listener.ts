import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Server } from '@stellar/stellar-sdk';
import { Horizon } from '@stellar/stellar-sdk';
import { FundingTransaction, TransactionStatus } from './funding-transaction.entity';

export interface PaymentEvent {
  id: string;
  pagingToken: string;
  amount: string;
  assetType: string;
  assetCode?: string;
  assetIssuer?: string;
  from: string;
  to: string;
  memo?: string;
  memoType?: string;
  timestamp: Date;
  transactionHash: string;
}

@Injectable()
export class HorizonListener implements OnModuleInit {
  private readonly logger = new Logger(HorizonListener.name);
  private readonly horizonServer: Server;
  private readonly protocolWalletAddress: string;
  private lastCursor: string = 'now';
  private isListening = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.horizonServer = new Horizon.Server(
      process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
    );
    this.protocolWalletAddress = process.env.PROTOCOL_WALLET_ADDRESS || '';
    
    if (!this.protocolWalletAddress) {
      throw new Error('PROTOCOL_WALLET_ADDRESS environment variable is required');
    }
  }

  async onModuleInit() {
    await this.startListening();
  }

  async startListening() {
    if (this.isListening) {
      this.logger.warn('Horizon listener is already running');
      return;
    }

    this.isListening = true;
    this.logger.log(`Starting Horizon listener for wallet: ${this.protocolWalletAddress}`);

    // Load the last cursor from persistent storage if available
    await this.loadLastCursor();

    // Start polling for new payments
    this.pollInterval = setInterval(() => {
      this.pollForPayments().catch(error => {
        this.logger.error('Error polling for payments:', error);
      });
    }, 5000); // Poll every 5 seconds

    // Initial poll
    await this.pollForPayments();
  }

  async stopListening() {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.logger.log('Stopped Horizon listener');
  }

  private async pollForPayments() {
    try {
      const payments = await this.horizonServer
        .payments()
        .forAccount(this.protocolWalletAddress)
        .cursor(this.lastCursor)
        .order('asc')
        .limit(10)
        .call();

      if (payments.records.length === 0) {
        return;
      }

      this.logger.log(`Found ${payments.records.length} new payment(s)`);

      for (const record of payments.records) {
        if (record.type === 'payment' && this.isValidPayment(record)) {
          const paymentEvent = this.parsePaymentRecord(record);
          await this.processPayment(paymentEvent);
        }
        this.lastCursor = record.paging_token;
      }

      // Save the cursor position
      await this.saveLastCursor();

    } catch (error) {
      this.logger.error('Error polling for payments:', error);
    }
  }

  private isValidPayment(record: any): boolean {
    // Only accept incoming payments (not outgoing)
    if (record.to !== this.protocolWalletAddress) {
      return false;
    }

    // Only accept native XLM or specific assets
    if (record.asset_type !== 'native' && !record.asset_code) {
      return false;
    }

    // Must have a memo for invoice identification
    if (!record.memo || record.memo_type !== 'text') {
      return false;
    }

    // Memo should start with "REPAY-" for repayments
    if (!record.memo.startsWith('REPAY-')) {
      return false;
    }

    return true;
  }

  private parsePaymentRecord(record: any): PaymentEvent {
    return {
      id: record.id,
      pagingToken: record.paging_token,
      amount: record.amount,
      assetType: record.asset_type,
      assetCode: record.asset_code,
      assetIssuer: record.asset_issuer,
      from: record.from,
      to: record.to,
      memo: record.memo,
      memoType: record.memo_type,
      timestamp: new Date(record.created_at),
      transactionHash: record.transaction_hash,
    };
  }

  private async processPayment(paymentEvent: PaymentEvent) {
    this.logger.log(
      `Processing payment: ${paymentEvent.amount} from ${paymentEvent.from} with memo: ${paymentEvent.memo}`
    );

    try {
      // Extract transaction ID from memo (format: REPAY-{transactionId}-{timestamp})
      const memoParts = paymentEvent.memo.split('-');
      if (memoParts.length < 2) {
        this.logger.warn(`Invalid memo format: ${paymentEvent.memo}`);
        return;
      }

      const transactionId = memoParts[1];
      
      // This would be injected via dependency injection in a real implementation
      // For now, we'll emit an event that the RepaymentService can handle
      this.logger.log(`Payment for transaction ${transactionId} detected`);
      
      // In a real implementation, you would emit an event or call a service directly
      // await this.repaymentService.processRepayment(transactionId, paymentEvent);
      
    } catch (error) {
      this.logger.error(`Error processing payment ${paymentEvent.id}:`, error);
    }
  }

  private async loadLastCursor(): Promise<void> {
    // In a real implementation, this would load from a database or Redis
    // For now, we'll use 'now' to start from current time
    this.lastCursor = 'now';
  }

  private async saveLastCursor(): Promise<void> {
    // In a real implementation, this would save to a database or Redis
    this.logger.debug(`Saved cursor: ${this.lastCursor}`);
  }

  async getAccountPayments(limit: number = 10, cursor?: string): Promise<any> {
    try {
      const payments = await this.horizonServer
        .payments()
        .forAccount(this.protocolWalletAddress)
        .cursor(cursor || 'now')
        .order('desc')
        .limit(limit)
        .call();

      return payments;
    } catch (error) {
      this.logger.error('Error fetching account payments:', error);
      throw error;
    }
  }

  isRunning(): boolean {
    return this.isListening;
  }
}
