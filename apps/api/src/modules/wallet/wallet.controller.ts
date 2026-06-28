import {
  Body,
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@thunder-spark/shared';
import { ok } from '../../common/api-response';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { DodoPaymentsService } from '../payments/dodo-payments.service';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly dodoPaymentsService: DodoPaymentsService,
  ) {}

  @Get()
  getWallet(@CurrentUser() user: User) {
    return ok({
      wallet: this.walletService.getWallet(user.id),
      transactions: this.walletService.getTransactions(user.id),
      paymentProvider: this.dodoPaymentsService.isConfigured() ? 'dodo' : 'stub',
    });
  }

  /** Dev stub — instant credit when Dodo is not configured. */
  @Post('recharge')
  recharge(@CurrentUser() user: User, @Body() body: unknown) {
    return ok(this.walletService.recharge(user, body));
  }

  /** Production — returns Dodo hosted checkout URL for mobile WebBrowser. */
  @Post('checkout')
  async checkout(@CurrentUser() user: User, @Body() body: { amountCents: number }) {
    if (!this.dodoPaymentsService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Dodo Payments not configured on server. Use /wallet/recharge stub or add Dodo env vars.',
      );
    }

    const productId = this.dodoPaymentsService.getProductIdForAmount(body.amountCents);
    if (!productId) {
      throw new ServiceUnavailableException(
        'Unsupported amount. Allowed: 2500, 5000, 10000 cents.',
      );
    }

    const session = await this.dodoPaymentsService.createCheckoutSession({
      productId,
      userId: user.id,
      userEmail: user.email,
      amountCents: body.amountCents,
    });

    return ok(session);
  }
}
