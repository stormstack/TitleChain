import { Module } from '@nestjs/common';
import { StellarClient } from './stellar-client';
import { TokenizationService } from './tokenization.service';

@Module({
  providers: [StellarClient, TokenizationService],
  exports: [StellarClient, TokenizationService],
})
export class StellarModule {}
