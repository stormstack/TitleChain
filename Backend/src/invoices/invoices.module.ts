import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { Invoice } from "./invoice.entity";
import { RiskModule } from "../risk/risk.module";
import { StellarModule } from "../stellar/stellar.module";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), RiskModule, StellarModule],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
