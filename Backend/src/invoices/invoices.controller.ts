import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { InvoicesService } from "./invoices.service";
import { Invoice, InvoiceStatus } from "./invoice.entity";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { UploadInvoiceDto } from "./dto/upload-invoice.dto";

@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadInvoice(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadInvoiceDto: UploadInvoiceDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type (PDF, DOC, DOCX, etc.)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, DOC, DOCX, JPEG, and PNG files are allowed',
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 10MB');
    }

    const invoiceData = {
      ...uploadInvoiceDto,
      dueDate: new Date(uploadInvoiceDto.dueDate),
      amount: uploadInvoiceDto.amount || 0,
    };

    return this.invoicesService.createWithFileUpload(invoiceData, file);
  }

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get(":id/risk")
  async getRiskScore(@Param("id") id: string) {
    try {
      return await this.invoicesService.getRiskScore(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.invoicesService.remove(id);
  }

  @Get("status/:status")
  findByStatus(@Param("status") status: InvoiceStatus) {
    return this.invoicesService.findByStatus(status);
  }

  @Get("counterparty/:counterpartyId")
  findByCounterparty(@Param("counterpartyId") counterpartyId: string) {
    return this.invoicesService.findByCounterparty(counterpartyId);
  }

  @Post(":id/tokenize")
  async tokenizeInvoice(@Param("id") id: string) {
    try {
      return await this.invoicesService.tokenizeInvoice(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get(":id/tokenization/status")
  async getTokenizationStatus(@Param("id") id: string) {
    try {
      return await this.invoicesService.getTokenizationStatus(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
