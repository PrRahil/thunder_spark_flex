import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true, credentials: true });

  // Friendly response when someone opens the Render URL root (not an error)
  const http = app.getHttpAdapter().getInstance();
  http.get('/', (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json({
      service: 'Thunder API',
      status: 'ok',
      version: '0.1.0',
      health: '/api/v1/health',
      apiBase: '/api/v1',
      hint: 'Use /api/v1/health to verify deployment',
    });
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Thunder API → http://localhost:${port}/api/v1/health`);
}

bootstrap();
