import { Controller, Get } from '@nestjs/common';
import { ok } from '../../common/api-response';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return ok({ status: 'ok', service: 'thunder-spark-api', version: '0.1.0' });
  }
}
