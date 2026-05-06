import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Invoice, InvoiceStatus } from '../invoices/invoice.entity';
import { StellarClient } from './stellar-client';
import { Keypair } from '@stellar/stellar-sdk';

export interface TokenizationResult {
  tokenId: string;
  txHash: string;
  tokenizedAt: Date;
  stellarNetwork: string;
}

export interface TokenMetadata {
  invoiceId: string;
  invoiceNumber: string;
  amount: string;
  counterpartyName: string;
  dueDate: string;
  riskGrade?: string;
  riskScore?: number;
}

@Injectable()
export class TokenizationService {
  private readonly logger = new Logger(TokenizationService.name);
  private readonly issuerKeypair: Keypair;

  constructor(private readonly stellarClient: StellarClient) {
    // Initialize the issuer keypair from environment variables
    const secretKey = process.env.STELLAR_ISSUER_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STELLAR_ISSUER_SECRET_KEY environment variable is required');
    }
    
    this.issuerKeypair = Keypair.fromSecret(secretKey);
    this.logger.log(`Tokenization service initialized with issuer: ${this.issuerKeypair.publicKey()}`);
  }

  async tokenizeInvoice(invoice: Invoice): Promise<TokenizationResult> {
    // Validate invoice can be tokenized
    this.validateInvoiceForTokenization(invoice);

    try {
      // Generate unique token ID for the invoice
      const tokenId = this.generateTokenId(invoice);
      
      // Convert amount to smallest unit (assuming 7 decimal places like XLM)
      const tokenAmount = this.convertToTokenUnits(invoice.amount);
      
      // Prepare token metadata
      const metadata = this.buildTokenMetadata(invoice);
      
      // Build and submit the mint transaction
      const transactionXdr = this.stellarClient.buildMintTransaction(
        this.issuerKeypair,
        tokenId,
        tokenAmount,
        metadata,
      );

      // Submit transaction to Stellar network
      const txResult = await this.stellarClient.submitTransaction(transactionXdr);
      
      // Wait for transaction finalization
      const finalizedTx = await this.stellarClient.waitForTransactionFinalization(txResult.hash);
      
      this.logger.log(`Successfully tokenized invoice ${invoice.id} with token ID: ${tokenId}`);
      
      return {
        tokenId,
        txHash: finalizedTx.hash,
        tokenizedAt: new Date(),
        stellarNetwork: this.stellarClient.getNetworkInfo().network,
      };
    } catch (error) {
      this.logger.error(`Failed to tokenize invoice ${invoice.id}:`, error);
      throw new BadRequestException(`Tokenization failed: ${error.message}`);
    }
  }

  async getTokenizationStatus(txHash: string): Promise<any> {
    try {
      return await this.stellarClient.getTransactionStatus(txHash);
    } catch (error) {
      this.logger.error(`Failed to get tokenization status for ${txHash}:`, error);
      throw error;
    }
  }

  private validateInvoiceForTokenization(invoice: Invoice): void {
    if (invoice.status !== InvoiceStatus.VERIFIED) {
      throw new BadRequestException('Only verified invoices can be tokenized');
    }

    if (invoice.stellarTokenId) {
      throw new BadRequestException('Invoice has already been tokenized');
    }

    if (!invoice.riskGrade) {
      throw new BadRequestException('Invoice must have a risk grade to be tokenized');
    }

    if (invoice.amount <= 0) {
      throw new BadRequestException('Invoice amount must be greater than 0');
    }
  }

  private generateTokenId(invoice: Invoice): string {
    // Generate a unique token ID based on invoice ID and timestamp
    const timestamp = Date.now();
    const prefix = 'TC'; // TitleChain prefix
    return `${prefix}_${invoice.id.slice(0, 8)}_${timestamp}`;
  }

  private convertToTokenUnits(amount: number): string {
    // Convert to smallest unit (7 decimal places for Stellar)
    const tokenUnits = Math.floor(amount * 10_000_000);
    return tokenUnits.toString();
  }

  private buildTokenMetadata(invoice: Invoice): any {
    const metadata: TokenMetadata = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount.toString(),
      counterpartyName: invoice.counterpartyName,
      dueDate: invoice.dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
    };

    if (invoice.riskGrade) {
      metadata.riskGrade = invoice.riskGrade;
    }

    if (invoice.riskScore) {
      metadata.riskScore = invoice.riskScore;
    }

    // Convert metadata to Stellar ScVal format
    const xdr = require('@stellar/stellar-sdk').xdr;
    const mapEntries = Object.entries(metadata).map(([key, value]) => {
      return new xdr.MapEntry({
        key: xdr.ScVal.scvString(key),
        value: xdr.ScVal.scvString(String(value)),
      });
    });

    return xdr.ScVal.scvMap(mapEntries);
  }

  async verifyIssuerAccount(): Promise<boolean> {
    try {
      const account = await this.stellarClient.getAccount(this.issuerKeypair.publicKey());
      this.logger.log(`Issuer account verified: ${account.accountId()}`);
      return true;
    } catch (error) {
      this.logger.error(`Issuer account verification failed: ${error.message}`);
      return false;
    }
  }

  async getContractInfo(): Promise<any> {
    try {
      return await this.stellarClient.getContractInfo();
    } catch (error) {
      this.logger.error('Failed to get contract info:', error);
      throw error;
    }
  }

  getIssuerAddress(): string {
    return this.issuerKeypair.publicKey();
  }

  async simulateTokenization(invoice: Invoice): Promise<any> {
    // Validate invoice first
    this.validateInvoiceForTokenization(invoice);

    try {
      const tokenId = this.generateTokenId(invoice);
      const tokenAmount = this.convertToTokenUnits(invoice.amount);
      const metadata = this.buildTokenMetadata(invoice);

      const transactionXdr = this.stellarClient.buildMintTransaction(
        this.issuerKeypair,
        tokenId,
        tokenAmount,
        metadata,
      );

      return await this.stellarClient.simulateTransaction(transactionXdr);
    } catch (error) {
      this.logger.error(`Failed to simulate tokenization for invoice ${invoice.id}:`, error);
      throw error;
    }
  }
}
