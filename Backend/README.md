# TitleChain Backend

A NestJS-based backend API for TitleChain with risk scoring functionality for invoice financing.

## Features

- Invoice management with CRUD operations
- Risk scoring service with weighted algorithm
- Risk grades (A/B/C) for verified invoices
- RESTful API with comprehensive endpoints

## Risk Scoring Algorithm

The risk scoring system evaluates invoices based on four factors:

1. **Counterparty Reputation** (30% weight): Score 1-100, higher is better
2. **Invoice Amount** (25% weight): Lower amounts have lower risk
3. **Due Date Proximity** (25% weight): More days until due is better
4. **Business History** (20% weight): Longer business history reduces risk

### Risk Grades
- **Grade A**: Score ≥ 85 (Low Risk)
- **Grade B**: Score ≥ 70 (Medium Risk)  
- **Grade C**: Score < 70 (High Risk)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database configuration
```

3. Start the development server:
```bash
npm run start:dev
```

## API Endpoints

### Invoices
- `GET /invoices` - List all invoices
- `GET /invoices/:id` - Get invoice by ID
- `POST /invoices` - Create new invoice
- `PATCH /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice
- `GET /invoices/:id/risk` - Get risk score for verified invoice
- `GET /invoices/status/:status` - Filter by status
- `GET /invoices/counterparty/:counterpartyId` - Filter by counterparty

### Invoice Status
- `pending` - Invoice created but not verified
- `verified` - Invoice verified, risk score calculated
- `rejected` - Invoice rejected

## Risk Score Calculation

Risk scores are automatically calculated when:
- An invoice is created with `verified` status
- An invoice is updated to `verified` status
- Any verified invoice is modified

The risk score is stored on the invoice record as `riskScore` (0-100) and `riskGrade` (A/B/C).

## Database Schema

The system uses PostgreSQL with the following main entity:

### Invoice
- `id` (UUID) - Primary key
- `invoiceNumber` (string) - Unique invoice identifier
- `amount` (decimal) - Invoice amount
- `counterpartyId` (string) - Counterparty identifier
- `counterpartyName` (string) - Counterparty name
- `dueDate` (date) - Invoice due date
- `status` (enum) - Invoice status
- `counterpartyReputation` (number) - 1-100 reputation score
- `businessHistoryMonths` (number) - Months in business
- `riskScore` (decimal) - Calculated risk score
- `riskGrade` (enum) - Risk grade (A/B/C)
- `createdAt` (timestamp) - Creation timestamp
- `updatedAt` (timestamp) - Last update timestamp

## Development

```bash
# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm test

# Lint code
npm run lint
```

## Configuration

The risk scoring parameters can be configured in `src/risk/scoring-weights.config.ts`:

- `DEFAULT_SCORING_WEIGHTS` - Adjust weight distribution
- `RISK_GRADE_THRESHOLDS` - Modify grade boundaries  
- `RISK_PARAMETERS` - Configure risk calculation parameters
