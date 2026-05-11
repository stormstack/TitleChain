import { IsString, IsNumber, IsDate, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { InvoiceStatus } from '../invoice.entity';

export class CreateInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  counterpartyId: string;

  @IsString()
  counterpartyName: string;

  @IsDate()
  dueDate: Date;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus = InvoiceStatus.PENDING_VERIFICATION;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  counterpartyReputation?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  businessHistoryMonths?: number;

  @IsOptional()
  @IsString()
  uploadedBy?: string; // Business user ID who uploaded
}
