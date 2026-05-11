# Repayment Service

This module handles automatic detection and processing of Stellar payments for invoice repayments.

## Features

- **Automatic Payment Detection**: Polls Stellar Horizon for incoming payments to the protocol wallet
- **Fund Distribution**: Automatically splits repayments between principal, interest, and protocol fees
- **Escrow Settlement**: Integrates with CollateralEscrow contracts to settle repayments
- **Status Updates**: Updates FundingTransaction status to REPAID when fully settled

## Architecture

### Components

1. **HorizonListener**: Monitors Stellar Horizon for incoming payments
2. **RepaymentService**: Orchestrates the repayment processing workflow
3. **RepaymentSplitter**: Calculates fund distribution splits
4. **FundingTransaction Entity**: Tracks transaction states and repayment status

### Workflow

1. Business client sends payment to protocol wallet with memo format: `REPAY-{transactionId}-{timestamp}`
2. HorizonListener detects incoming payment via polling
3. RepaymentService validates payment and calculates splits
4. Funds are distributed to investor (principal + interest) and protocol (fees)
5. CollateralEscrow contract is called to settle the escrow
6. FundingTransaction status is updated to REPAID

## Environment Variables

Required environment variables:

```bash
# Stellar Configuration
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
PROTOCOL_WALLET_ADDRESS=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Database Configuration (from existing setup)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=titlechain

# Stellar Contract Configuration
STELLAR_RWAMINT_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75GJV6UYBK2UHRY4NGK6ZVDWHPRYJMRQAWAG
```

## Database Schema

### FundingTransaction Entity

- **id**: UUID primary key
- **invoiceId**: Reference to invoice
- **investorId**: Investor wallet address
- **principalAmount**: Original principal amount
- **interestAmount**: Interest amount
- **protocolFeeAmount**: Protocol fee amount
- **totalAmount**: Total amount (principal + interest + fees)
- **repaidAmount**: Amount already repaid
- **status**: Transaction status (PENDING, FUNDED, REPAID, DEFAULTED)
- **stellarTxHash**: Original funding transaction hash
- **escrowContractId**: CollateralEscrow contract ID
- **repaymentTxHash**: Repayment transaction hash
- **fundedAt**: Timestamp when funded
- **repaidAt**: Timestamp when repaid
- **memo**: Payment memo for identification
- **protocolWalletAddress**: Protocol wallet address

## API Endpoints

The RepaymentService provides the following methods:

### RepaymentService Methods

- `processRepayment(transactionId, paymentEvent)`: Process a detected repayment
- `getPendingRepayments()`: Get all pending repayment transactions
- `getTransactionById(id)`: Get transaction by ID
- `getTransactionsByInvestor(investorId)`: Get transactions for investor
- `getTransactionsByStatus(status)`: Get transactions by status
- `manualReconciliation(transactionId, repaymentAmount)`: Manual reconciliation for missed payments

### HorizonListener Methods

- `startListening()`: Start polling for payments
- `stopListening()`: Stop polling
- `getAccountPayments()`: Get recent account payments
- `isRunning()`: Check if listener is active

## Payment Processing

### Memo Format

Payments must include a text memo with format: `REPAY-{transactionId}-{timestamp}`

Example: `REPAY-123e4567-e89b-12d3-a456-426614174000-1703123456789`

### Fund Distribution

Repayments are split proportionally:

- **Principal**: Goes to investor wallet
- **Interest**: Goes to investor wallet  
- **Protocol Fee**: Goes to protocol wallet

For partial repayments, splits are calculated proportionally to the original amounts.

### Error Handling

- Invalid payment amounts are rejected
- Duplicate payments are detected and logged
- Failed escrow settlements are retried
- All errors are logged with transaction context

## Integration Points

### CollateralEscrow Contract

The service integrates with CollateralEscrow contracts to:

1. Settle the escrow when repayment is received
2. Release collateral to the investor
3. Transfer protocol fees to the protocol wallet

### Stellar Integration

- Uses Stellar Horizon API for payment detection
- Integrates with existing StellarClient for contract interactions
- Supports both testnet and mainnet configurations

## Monitoring

The service provides comprehensive logging:

- Payment detection events
- Fund distribution calculations
- Escrow settlement results
- Transaction status updates
- Error conditions with full context

## Testing

To test the repayment system:

1. Set up test environment with testnet configuration
2. Create a test FundingTransaction with FUNDED status
3. Send a test payment to protocol wallet with proper memo format
4. Verify automatic processing and status updates

## Security Considerations

- All payments are validated against expected amounts
- Memo format is strictly enforced
- Escrow contracts are verified before settlement
- Protocol wallet private keys should be securely stored
- All transactions are logged for audit trails
