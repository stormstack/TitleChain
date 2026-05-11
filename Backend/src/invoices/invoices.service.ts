import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Invoice, InvoiceStatus } from "./invoice.entity";
import {
  RiskScoringService,
  RiskScoreResult,
} from "../risk/risk-scoring.service";
import {
  TokenizationService,
  TokenizationResult,
} from "../stellar/tokenization.service";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly riskScoringService: RiskScoringService,
    private readonly tokenizationService: TokenizationService,
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
      throw new NotFoundException(
        `Risk score is only available for verified invoices`,
      );
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

  async tokenizeInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    try {
      // Call the tokenization service to mint the token
      const tokenizationResult =
        await this.tokenizationService.tokenizeInvoice(invoice);

      // Update the invoice with tokenization details
      invoice.stellarTokenId = tokenizationResult.tokenId;
      invoice.tokenizationTxHash = tokenizationResult.txHash;
      invoice.tokenizedAt = tokenizationResult.tokenizedAt;

      // Save the updated invoice
      return await this.invoiceRepository.save(invoice);
    } catch (error) {
      throw new BadRequestException(`Tokenization failed: ${error.message}`);
    }
  }

  async getTokenizationStatus(id: string): Promise<any> {
    const invoice = await this.findOne(id);

    if (!invoice.tokenizationTxHash) {
      throw new NotFoundException("Invoice has not been tokenized");
    }

    try {
      return await this.tokenizationService.getTokenizationStatus(
        invoice.tokenizationTxHash,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to get tokenization status: ${error.message}`,
      );
    }
  }

  async findTokenizedInvoices(): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      where: { stellarTokenId: null },
    });
  }

  async createWithFileUpload(
    invoiceData: Partial<Invoice>,
    file: Express.Multer.File,
  ): Promise<Invoice> {
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Create invoice with file information
    const invoice = this.invoiceRepository.create({
      ...invoiceData,
      status: InvoiceStatus.PENDING_VERIFICATION,
      documentFileName: file.originalname,
      documentFilePath: filePath,
      documentMimeType: file.mimetype,
      documentSize: file.size,
    });

    return await this.invoiceRepository.save(invoice);
  }

  async getInvoiceFile(invoiceId: string): Promise<{ file: Buffer; filename: string; mimeType: string }> {
    const invoice = await this.findOne(invoiceId);

    if (!invoice.documentFilePath) {
      throw new NotFoundException(`Invoice ${invoiceId} has no associated document`);
    }

    if (!fs.existsSync(invoice.documentFilePath)) {
      throw new NotFoundException(`Document file not found for invoice ${invoiceId}`);
    }

    const fileBuffer = fs.readFileSync(invoice.documentFilePath);

    return {
      file: fileBuffer,
      filename: invoice.documentFileName,
      mimeType: invoice.documentMimeType,
    };
  }

  async deleteInvoiceFile(invoiceId: string): Promise<void> {
    const invoice = await this.findOne(invoiceId);

    if (invoice.documentFilePath && fs.existsSync(invoice.documentFilePath)) {
      fs.unlinkSync(invoice.documentFilePath);
    }

    // Update invoice to remove file information
    await this.invoiceRepository.update(invoiceId, {
      documentFileName: null,
      documentFilePath: null,
      documentMimeType: null,
      documentSize: null,
    });
  }
}
