import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Invoice } from "../invoices/invoice.entity";

export enum TransactionStatus {
  PENDING = "pending",
  FUNDED = "funded",
  REPAID = "repaid",
  DEFAULTED = "defaulted",
}

export enum SplitType {
  PRINCIPAL = "principal",
  INTEREST = "interest",
  PROTOCOL_FEE = "protocol_fee",
}

@Entity("funding_transactions")
export class FundingTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  invoiceId: string;

  @ManyToOne(() => Invoice, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice;

  @Column()
  investorId: string;

  @Column("decimal", { precision: 15, scale: 7 })
  principalAmount: number;

  @Column("decimal", { precision: 15, scale: 7 })
  interestAmount: number;

  @Column("decimal", { precision: 15, scale: 7 })
  protocolFeeAmount: number;

  @Column("decimal", { precision: 15, scale: 7 })
  totalAmount: number;

  @Column("decimal", { precision: 15, scale: 7, nullable: true })
  repaidAmount: number;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  stellarTxHash: string;

  @Column({ nullable: true })
  escrowContractId: string;

  @Column({ nullable: true })
  repaymentTxHash: string;

  @Column({ type: "datetime", nullable: true })
  fundedAt: Date;

  @Column({ type: "datetime", nullable: true })
  repaidAt: Date;

  @Column({ nullable: true })
  memo: string;

  @Column({ nullable: true })
  protocolWalletAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
