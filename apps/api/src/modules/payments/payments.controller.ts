import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { Webhook } from 'standardwebhooks';
import { ok } from '../../common/api-response';
import { WalletService } from '../wallet/wallet.service';
import { DodoPaymentsService } from './dodo-payments.service';

interface DodoWebhookPayload {
  type: string;
  data?: {
    metadata?: Record<string, string>;
    payment_id?: string;
  };
}

@Controller('webhooks/dodo')
export class PaymentsWebhookController {
  private readonly webhook = process.env.DODO_WEBHOOK_SECRET
    ? new Webhook(process.env.DODO_WEBHOOK_SECRET)
    : null;

  constructor(private readonly walletService: WalletService) {}

  /** Browser/Dodo URL check — webhooks are delivered via POST only. */
  @Get()
  verifyEndpoint() {
    return ok({
      status: 'webhook_active',
      method: 'POST',
      events: ['payment.succeeded', 'payment.failed'],
      hint: 'Dodo sends POST requests here. Opening this URL in a browser (GET) is only for verification.',
      secretConfigured: Boolean(process.env.DODO_WEBHOOK_SECRET),
    });
  }

  @Post()
  @HttpCode(200)
  async handleDodoWebhook(
    @Req() req: { rawBody?: Buffer },
    @Headers('webhook-id') webhookId: string,
    @Headers('webhook-timestamp') webhookTimestamp: string,
    @Headers('webhook-signature') webhookSignature: string,
    @Body() body: DodoWebhookPayload,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(body);

    if (this.webhook) {
      await this.webhook.verify(rawBody, {
        'webhook-id': webhookId,
        'webhook-timestamp': webhookTimestamp,
        'webhook-signature': webhookSignature,
      });
    }

    if (body.type === 'payment.succeeded') {
      const metadata = body.data?.metadata ?? {};
      const userId = metadata.user_id;
      const amountCents = Number(metadata.amount_cents);
      const referenceId = metadata.idempotency_key ?? body.data?.payment_id ?? 'unknown';

      if (userId && amountCents > 0) {
        this.walletService.creditFromPayment(userId, amountCents, {
          referenceType: 'DODO_PAYMENT',
          referenceId,
          description: 'Wallet recharge (Dodo Payments)',
        });
      }
    }

    return ok({ received: true });
  }
}
