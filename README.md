# TitleChain

> **Borrow against what you're already owed.**

TitleChain is a Stellar-based protocol that lets businesses tokenize their unpaid invoices and real-world assets as collateral to access instant USDC liquidity. Investors and DAOs fund these assets and earn yield automatically via Soroban smart contracts — no banks, no delays.

---

## The Problem

Businesses across emerging markets complete real work — deliver goods, finish contracts, supply services — then wait 60–90 days to get paid. That waiting kills cashflow. Banks offer loans, but the process is slow, expensive, and most businesses don't qualify.

## The Solution

TitleChain lets a business upload a verified unpaid invoice onto Stellar, tokenize it as a Soroban-based asset, and instantly borrow against it in USDC. When the client eventually pays the invoice, the smart contract automatically routes repayment to the investor — with interest. No middleman. No paperwork. No weeks of waiting.

---

## How It Works

```
Business uploads invoice → Platform verifies it → Asset is tokenized on Stellar
       ↓
Investor / DAO funds it in USDC → Business receives liquidity within 48hrs
       ↓
Client pays invoice → Smart contract auto-repays investor + yield
```

---

## Who Is It For?

**Businesses** — SMEs, suppliers, contractors, and logistics companies waiting on large unpaid invoices.

**DAOs & Investors** — Treasuries sitting on idle USDC looking for real, predictable yield backed by actual business activity — not speculation.

---

## Architecture

### Frontend

- Business asset dashboard — upload and manage invoices, purchase orders, title deeds
- Liquidity pool marketplace — investors browse tokenized assets with risk grades and LTV ratios
- Repayment tracker — live repayment schedules for borrowers and yield tracking for lenders
- DAO governance panel — vote on risk parameters and accepted asset categories

### Backend

- Asset verification engine — validates uploaded invoices against business registries and document APIs
- Risk scoring model — grades each asset (A/B/C) based on counterparty creditworthiness and asset type
- Oracle service — feeds real-world FX and commodity data into Soroban contracts
- Repayment router — detects incoming payments and automatically splits between principal, interest, and protocol fee

### Soroban Smart Contracts

| Contract           | Purpose                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `RWAMint`          | Tokenizes a verified real-world asset into a Soroban token         |
| `CollateralEscrow` | Locks asset token and releases USDC to borrower at agreed LTV      |
| `LendingPool`      | Manages DAO/investor deposits and distributes yield proportionally |
| `Liquidation`      | Handles default recovery by auctioning the RWA token               |
| `DAOGovernance`    | Token-weighted voting on protocol parameters                       |

---

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Stellar Wallets Kit
- **Backend:** Node.js, Express, PostgreSQL, Prisma
- **Smart Contracts:** Soroban SDK (Rust)
- **Payments:** Stellar USDC, Trustless Work escrow
- **Integrations:** Stellar Horizon API, GitHub (via GrantFox)

---

## Why Stellar?

| Need            | Stellar Solution                                          |
| --------------- | --------------------------------------------------------- |
| Fast settlement | Transactions confirm in 3–5 seconds                       |
| Low cost        | Fees cost fractions of a cent                             |
| Stable currency | Native USDC — no volatility risk                          |
| Trustless logic | Soroban smart contracts handle the full lending lifecycle |
| Cross-border    | A supplier in Lagos and a DAO in Berlin on the same rail  |

---

## Status

🚧 **Early stage — ideation and architecture phase.**

We are currently scoping the core Soroban contracts and planning the MVP. Contributors are being onboarded via [GrantFox](https://contribute.grantfox.xyz/).

---

## Contributing

We are actively looking for contributors in:

- **Soroban / Rust** — smart contract development
- **Node.js / PostgreSQL** — backend and verification engine
- **Next.js / TypeScript** — frontend dashboard

Check our open issues on [GrantFox](https://contribute.grantfox.xyz/) to get started and earn USDC rewards for merged contributions.

---

## License

MIT
