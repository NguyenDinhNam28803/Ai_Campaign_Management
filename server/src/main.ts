import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return url;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  // Frontend gọi kèm cookie (credentials). origin phản chiếu (không dùng '*' khi có credentials).
  app.enableCors({
    origin: configService.get<string[] | boolean>('app.corsOrigin')!,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('app.port')!;
  await app.listen(port);

  // ── Startup banner ───────────────────────────────────────────
  const dbUrl = maskUrl(process.env.DATABASE_URL ?? 'n/a');
  const redisUrl = maskUrl(configService.get<string>('redis.url') ?? 'n/a');
  const ollamaUrl = configService.get<string>('ollama.baseUrl') ?? 'n/a';
  const ollamaModel = configService.get<string>('ollama.model') ?? 'n/a';

  console.log('');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│          AI Content Platform — P6           │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│  Server    : http://localhost:${port}            │`);
  console.log(`│  Database  : ${dbUrl.slice(0, 35).padEnd(35)} │`);
  console.log(`│  Redis     : ${redisUrl.slice(0, 35).padEnd(35)} │`);
  console.log(`│  AI Engine : Ollama (self-hosted)            │`);
  console.log(`│  AI URL    : ${ollamaUrl.padEnd(35)} │`);
  console.log(`│  AI Model  : ${ollamaModel.padEnd(35)} │`);
  console.log('└─────────────────────────────────────────────┘');
  console.log('');
}
void bootstrap();
