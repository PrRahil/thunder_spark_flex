import { Body, Controller, Post } from '@nestjs/common';
import { ok } from '../../common/api-response';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    const result = await this.authService.register(body);
    return ok(result);
  }

  @Post('login')
  async login(@Body() body: unknown) {
    const result = await this.authService.login(body);
    return ok(result);
  }
}
