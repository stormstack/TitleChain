import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './invoice.entity';
import { RiskScoringService, RiskScoreResult } from '../risk/risk-scoring.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly riskScoringService: RiskScoringService,
  ) {}

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(invoiceData);
    
    // Calculate risk score for new invoice
    if (invoice.status === InvoiceStatus.VERIFIED) {
      const riskResult = this.riskScoringService.calculateRiskScore(invoice);
      invoice.riskScore = riskResult.score;
      invoice.riskGrade = riskResult.grade;
    }
    
    return await this.invoiceRepository.save(invoice);
  }

  async findAll(): Promise<Invoice[]> {
    return await this.invoiceRepository.find();
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async update(id: string, updateData: Partial<Invoice>): Promise<Invoice> {
    const invoice = await this.findOne(id);
    
    // Merge update data
    Object.assign(invoice, updateData);
    
    // Recalculate risk score if invoice is verified or status changed to verified
    if (invoice.status === InvoiceStatus.VERIFIED) {
      const riskResult = this.riskScoringService.calculateRiskScore(invoice);
      invoice.riskScore = riskResult.score;
      invoice.riskGrade = riskResult.grade;
    }
    
    return await this.invoiceRepository.save(invoice);
  }

  async getRiskScore(id: string): Promise<RiskScoreResult> {
    const invoice = await this.findOne(id);
    
    if (invoice.status !== InvoiceStatus.VERIFIED) {
      throw new NotFoundException(`Risk score is only available for verified invoices`);
    }
    
    return this.riskScoringService.calculateRiskScore(invoice);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.remove(invoice);
  }

  async findByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    return await this.invoiceRepository.find({ where: { status } });
  }

  async findByCounterparty(counterpartyId: string): Promise<Invoice[]> {
    return await this.invoiceRepository.find({ where: { counterpartyId } });
  }
}
