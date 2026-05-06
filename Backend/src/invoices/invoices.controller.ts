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
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { Invoice, InvoiceStatus } from "./invoice.entity";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";

@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
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
