import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { User } from '@thunder-spark/shared';
import { ok } from '../../common/api-response';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { ProvidersService } from './providers.service';

@Controller('providers')
@UseGuards(AuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return ok(this.providersService.list(user.id));
  }

  @Post('connect')
  connect(@CurrentUser() user: User, @Body() body: unknown) {
    return ok(this.providersService.connect(user, body));
  }
}
