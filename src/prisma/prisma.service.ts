import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // Sem DATABASE_URL o app roda em modo sem persistência (simulações não são salvas)
  readonly client: PrismaClient | null = process.env.DATABASE_URL
    ? new PrismaClient()
    : null;

  constructor() {
    if (!this.client) {
      this.logger.warn(
        'DATABASE_URL não definida — histórico de simulações desativado.',
      );
    }
  }

  async onModuleDestroy() {
    await this.client?.$disconnect();
  }
}
