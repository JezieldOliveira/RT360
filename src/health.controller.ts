import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  health() {
    return {
      status: 'ok',
      database: this.prisma.client ? 'configured' : 'disabled',
      timestamp: new Date().toISOString(),
    };
  }
}
