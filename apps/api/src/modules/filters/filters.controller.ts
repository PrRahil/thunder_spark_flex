import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { User } from '@thunder-spark/shared';
import { ok } from '../../common/api-response';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser } from '../../common/current-user.decorator';
import { FiltersService } from './filters.service';

@Controller('filters')
@UseGuards(AuthGuard)
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return ok(this.filtersService.list(user.id));
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return ok(this.filtersService.get(user.id, id));
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: unknown) {
    return ok(this.filtersService.create(user, body));
  }

  @Put(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() body: unknown) {
    return ok(this.filtersService.update(user.id, id, body));
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    this.filtersService.remove(user.id, id);
    return ok({ deleted: true });
  }
}
