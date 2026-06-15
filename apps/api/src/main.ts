import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Thunder API → http://localhost:${port}/api/v1`);
  console.log(`LAN access → set EXPO_PUBLIC_API_URL=http://<your-ip>:${port}/api/v1`);
}

bootstrap();
