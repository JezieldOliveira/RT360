import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Sem DATABASE_URL o app roda em modo sem persistência (simulações não são salvas).
  // O @prisma/client só é carregado quando há banco — evita depender do engine Prisma
  // em ambientes serverless sem banco configurado.
  client: PrismaClient | null = null;

  constructor() {
    if (process.env.DATABASE_URL) {
      const { PrismaClient: Client } = require('@prisma/client');
      this.client = new Client();
    } else {
      this.logger.warn(
        'DATABASE_URL não definida — histórico de simulações desativado.',
      );
    }
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }
}
