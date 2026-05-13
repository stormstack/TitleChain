import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum InvoiceStatus {
  PENDING = "pending",
  PENDING_VERIFICATION = "pending_verification",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export enum RiskGrade {
  A = "A",
  B = "B",
  C = "C",
}

@Entity("invoices")
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  invoiceNumber: string;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @Column()
  counterpartyId: string;

  @Column()
  counterpartyName: string;

  @Column()
  dueDate: Date;

  @Column({
    type: "enum",
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING_VERIFICATION,
  })
  status: InvoiceStatus;

  @Column({ nullable: true })
  documentFileName: string;

  @Column({ nullable: true })
  documentFilePath: string;

  @Column({ nullable: true })
  documentMimeType: string;

  @Column({ nullable: true })
  documentSize: number;

  @Column({ nullable: true })
  uploadedBy: string; // Business user ID who uploaded

  @Column({ nullable: true })
  counterpartyReputation: number; // 1-100 score

  @Column({ nullable: true })
  businessHistoryMonths: number; // months in business

  @Column("decimal", { precision: 5, scale: 2, nullable: true })
  riskScore: number; // 0-100 score

  @Column({
    type: "enum",
    enum: RiskGrade,
    nullable: true,
  })
  riskGrade: RiskGrade;

  @Column({ nullable: true })
  stellarTokenId: string; // Stellar token ID after tokenization

  @Column({ nullable: true })
  tokenizationTxHash: string; // Transaction hash of tokenization

  @Column({ type: "datetime", nullable: true })
  tokenizedAt: Date; // When the invoice was tokenized

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
