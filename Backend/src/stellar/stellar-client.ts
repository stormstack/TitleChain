import { Injectable, Logger } from '@nestjs/common';
import {
  Horizon,
  Server,
  TransactionBuilder,
  Networks,
  Asset,
  Keypair,
  Contract,
  SorobanDataBuilder,
  xdr,
  Operation,
} from '@stellar/stellar-sdk';
import axios from 'axios';

@Injectable()
export class StellarClient {
  private readonly logger = new Logger(StellarClient.name);
  private readonly server: Server;
  private readonly horizonServer: Server;
  private readonly contractId: string;
  private readonly networkPassphrase: string;

  constructor() {
    // Use Stellar testnet by default
    this.server = new Server('https://soroban-testnet.stellar.org');
    this.horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');
    this.networkPassphrase = Networks.TESTNET;
    
    // RWAMint contract ID - this should be configured via environment variables
    this.contractId = process.env.STELLAR_RWAMINT_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75GJV6UYBK2UHRY4NGK6ZVDWHPRYJMRQAWAG';
  }

  async getAccount(accountId: string): Promise<any> {
    try {
      return await this.horizonServer.loadAccount(accountId);
    } catch (error) {
      this.logger.error(`Failed to load account ${accountId}:`, error);
      throw error;
    }
  }

  async submitTransaction(transactionXdr: string): Promise<any> {
    try {
      const transaction = TransactionBuilder.fromXDR(
        transactionXdr,
        this.networkPassphrase,
      );
      
      const result = await this.server.sendTransaction(transaction);
      this.logger.log(`Transaction submitted: ${result.hash}`);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to submit transaction:', error);
      throw error;
    }
  }

  async getTransactionStatus(txHash: string): Promise<any> {
    try {
      return await this.server.getTransaction(txHash);
    } catch (error) {
      this.logger.error(`Failed to get transaction status for ${txHash}:`, error);
      throw error;
    }
  }

  async simulateTransaction(transactionXdr: string): Promise<any> {
    try {
      const transaction = TransactionBuilder.fromXDR(
        transactionXdr,
        this.networkPassphrase,
      );
      
      const simulation = await this.server.simulateTransaction(transaction);
      return simulation;
    } catch (error) {
      this.logger.error('Failed to simulate transaction:', error);
      throw error;
    }
  }

  buildMintTransaction(
    sourceKeypair: Keypair,
    tokenId: string,
    amount: string,
    metadata?: any,
  ): string {
    try {
      const sourceAccount = new Account(sourceKeypair.publicKey(), '1');
      
      const contract = new Contract(this.contractId);
      
      // Build the mint operation for the RWAMint contract
      const mintOp = Operation.invokeContractFunction({
        contract: contract,
        function: 'mint',
        args: [
          xdr.ScVal.scvString(tokenId),
          xdr.ScVal.scvI128(xdr.Int128.fromString(amount)),
          metadata ? xdr.ScVal.scvMap(metadata) : xdr.ScVal.scvVoid(),
        ],
      });

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(mintOp)
        .setTimeout(30)
        .build();

      // Sign the transaction
      transaction.sign(sourceKeypair);
      
      return transaction.toXDR();
    } catch (error) {
      this.logger.error('Failed to build mint transaction:', error);
      throw error;
    }
  }

  async waitForTransactionFinalization(
    txHash: string,
    maxWaitTime: number = 60000,
    pollInterval: number = 2000,
  ): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await this.getTransactionStatus(txHash);
        
        if (result.status === 'success') {
          return result;
        } else if (result.status === 'failed') {
          throw new Error(`Transaction failed: ${result.resultXdr}`);
        }
        
        // Transaction is still pending, wait and retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        // Transaction might not be indexed yet, continue waiting
        if (error.message.includes('not found')) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error(`Transaction ${txHash} did not finalize within ${maxWaitTime}ms`);
  }

  getNetworkInfo(): { network: string; contractId: string } {
    return {
      network: this.networkPassphrase === Networks.TESTNET ? 'testnet' : 'mainnet',
      contractId: this.contractId,
    };
  }

  async getContractInfo(): Promise<any> {
    try {
      // Get contract information from Soroban RPC
      const contractData = await this.server.getContractData(
        this.contractId,
        xdr.ScVal.scvLedgerKeyContractInstance(),
      );
      
      return contractData;
    } catch (error) {
      this.logger.error('Failed to get contract info:', error);
      throw error;
    }
  }
}
