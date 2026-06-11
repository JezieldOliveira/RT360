import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { SimulationsModule } from './simulations/simulations.module';

// Na Vercel o conteúdo de public/ é servido pela CDN; o ServeStatic só é usado localmente
const staticImports = process.env.VERCEL
  ? []
  : [
      ServeStaticModule.forRoot({
        rootPath: join(__dirname, '..', 'public'),
        exclude: ['/api/{*splat}'],
      }),
    ];

@Module({
  imports: [...staticImports, PrismaModule, SimulationsModule],
  controllers: [HealthController],
})
export class AppModule {}
