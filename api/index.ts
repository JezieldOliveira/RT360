// Entrypoint serverless da Vercel.
// O @vercel/node compila este arquivo e toda a árvore do Nest importada a partir dele
// (usando o tsconfig.json da raiz, com os decorators habilitados).
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let ready: Promise<(req: unknown, res: unknown) => void> | null = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  await app.init();
  // Instância Express subjacente, reaproveitada entre invocações da função
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: unknown, res: unknown) {
  ready ??= bootstrap();
  const server = await ready;
  return server(req, res);
}
