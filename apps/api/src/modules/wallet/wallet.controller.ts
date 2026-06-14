import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { User } from '@thunder-spark/shared';
import { ok } from '../../common/api-response';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(AuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser() user: User) {
    return ok({
      wallet: this.walletService.getWallet(user.id),
      transactions: this.walletService.getTransactions(user.id),
    });
  }

  @Post('recharge')
  recharge(@CurrentUser() user: User, @Body() body: unknown) {
    return ok(this.walletService.recharge(user, body));
  }
}
