import { Module, forwardRef } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { DodoPaymentsService } from './dodo-payments.service';
import { PaymentsWebhookController } from './payments.controller';

@Module({
  imports: [forwardRef(() => WalletModule)],
  controllers: [PaymentsWebhookController],
  providers: [DodoPaymentsService],
  exports: [DodoPaymentsService],
})
export class PaymentsModule {}
