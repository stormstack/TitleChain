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
    {
      provide: RepaymentService,
      useFactory: (repaymentSplitter: RepaymentSplitter, horizonListener: HorizonListener, stellarClient: any) => new RepaymentService(
        // These would be injected via constructor in a real implementation
        // For now, we'll use forwardRef to resolve the circular dependency
        null as any, // fundingTransactionRepository
        repaymentSplitter,
        horizonListener,
        stellarClient,
      ),
      inject: [RepaymentSplitter, HorizonListener, 'StellarClient'],
    },
    RepaymentSplitter,
    HorizonListener,
  ],
  exports: [
    RepaymentService,
    RepaymentSplitter,
    HorizonListener,
  ],
})
export class RepaymentModule {}
