import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSimulationDto } from './dto/create-simulation.dto';
import { runSimulation, SimulationResult } from './tax-engine';

@Injectable()
export class SimulationsService {
  private readonly logger = new Logger(SimulationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Cálculo ao vivo da prévia (não persiste) — usado pelo wizard a cada alteração
  preview(dto: CreateSimulationDto): SimulationResult {
    return runSimulation(dto);
  }

  async create(
    dto: CreateSimulationDto,
  ): Promise<SimulationResult & { id: string | null; saved: boolean }> {
    const result = runSimulation(dto);

    // Persistência é best-effort: falha de banco não impede o diagnóstico
    let id: string | null = null;
    if (this.prisma.client) {
      try {
        const row = await this.prisma.client.simulation.create({
          data: {
            regime: dto.regime,
            receita: dto.receita,
            bestRegime: result.melhor.nome,
            lucro2033: result.melhor.liq,
            margem2033: result.melhor.marg,
            inputs: dto as unknown as Prisma.InputJsonValue,
            result: result as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });
        id = row.id;
      } catch (err) {
        this.logger.error(`Falha ao salvar simulação: ${err}`);
      }
    }

    return { ...result, id, saved: id !== null };
  }

  async findRecent(limit = 50) {
    if (!this.prisma.client) return [];
    try {
      return await this.prisma.client.simulation.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        select: {
          id: true,
          createdAt: true,
          regime: true,
          receita: true,
          bestRegime: true,
          lucro2033: true,
          margem2033: true,
        },
      });
    } catch (err) {
      this.logger.error(`Falha ao listar simulações: ${err}`);
      return [];
    }
  }

  async findOne(id: string) {
    if (!this.prisma.client) {
      throw new NotFoundException('Histórico de simulações indisponível.');
    }
    const row = await this.prisma.client.simulation.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException('Simulação não encontrada.');
    return row;
  }
}
