import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { BlockJobsModule } from './modules/block-jobs/block-jobs.module';
import { FiltersModule } from './modules/filters/filters.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    StoreModule,
    HealthModule,
    AuthModule,
    FiltersModule,
    WalletModule,
    PaymentsModule,
    ProvidersModule,
    BlockJobsModule,
  ],
})
export class AppModule {}
