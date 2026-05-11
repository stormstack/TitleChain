import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { InvoiceStatus } from '../invoice.entity';

export class UploadInvoiceDto {
  @IsString()
  invoiceNumber: string;

  @IsString()
  counterpartyId: string;

  @IsString()
  counterpartyName: string;

  @IsString()
  dueDate: string; // Will be parsed as Date

  @IsOptional()
  @IsNumber()
  amount?: number;

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
