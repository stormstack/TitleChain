import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepaymentService } from './repayment.service';
import { RepaymentSplitter } from './repayment-splitter';
import { HorizonListener } from './horizon-listener';
import { FundingTransaction } from './funding-transaction.entity';
import { StellarModule } from '../stellar/stellar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FundingTransaction]),
    StellarModule,
  ],
  providers: [
    RepaymentSplitter,
    HorizonListener,
    RepaymentService,
  ],
  exports: [
    RepaymentService,
    RepaymentSplitter,
    HorizonListener,
  ],
})
export class RepaymentModule {}
