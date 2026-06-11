import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { SimulationsModule } from './simulations/simulations.module';

// O Nest serve tanto a API (prefixo /api) quanto o frontend estático em public/.
// process.cwd() é a raiz do projeto tanto localmente quanto na função serverless da Vercel.
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/api/{*splat}'],
    }),
    PrismaModule,
    SimulationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
