import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@thunder-spark/shared';
import { ok } from '../../common/api-response';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { BlockJobsService } from './block-jobs.service';

@Controller('block-jobs')
@UseGuards(AuthGuard)
export class BlockJobsController {
  constructor(private readonly blockJobsService: BlockJobsService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return ok(this.blockJobsService.list(user.id));
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return ok(this.blockJobsService.get(user.id, id));
  }

  @Post('start')
  start(@CurrentUser() user: User, @Body() body: unknown) {
    return ok(this.blockJobsService.start(user, body));
  }

  @Post(':id/stop')
  stop(@CurrentUser() user: User, @Param('id') id: string) {
    return ok(this.blockJobsService.stop(user.id, id));
  }

  @Post(':id/refund')
  refund(@CurrentUser() user: User, @Param('id') id: string) {
    return ok(this.blockJobsService.refund(user.id, id));
  }
}
