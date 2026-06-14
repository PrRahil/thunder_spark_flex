import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AmazonFlexAdapter } from '../block-engine/amazon-flex.adapter';
import { BlockEngineService } from '../block-engine/block-engine.service';
import { FiltersModule } from '../filters/filters.module';
import { ProvidersModule } from '../providers/providers.module';
import { WalletModule } from '../wallet/wallet.module';
import { BlockJobsController } from './block-jobs.controller';
import { BlockJobsService } from './block-jobs.service';

@Module({
  imports: [AuthModule, FiltersModule, WalletModule, ProvidersModule],
  controllers: [BlockJobsController],
  providers: [BlockJobsService, BlockEngineService, AmazonFlexAdapter],
})
export class BlockJobsModule {}
