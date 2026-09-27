import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  DashboardRepository,
  DashboardSnapshot,
} from '../application/ports/dashboard.repository';

const decimal = (value: { toString(): string } | null): number | null =>
  value === null ? null : Number(value.toString());

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async load(farmId: number): Promise<DashboardSnapshot> {
    const client = this.tenantPrisma.getClient();
    const [animals, measurements] = await Promise.all([
      client.animal.findMany({
        where: { fazendaId: farmId, ativo: true },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          loteId: true,
          pastoId: true,
          pesoAtual: true,
          lote: { select: { descricao: true } },
          pasto: { select: { descricao: true } },
        },
      }),
      client.pesagem.findMany({
        where: { fazendaId: farmId, ativa: true },
        orderBy: [{ dataPesagem: 'asc' }, { id: 'asc' }],
        select: { id: true, animalId: true, peso: true, dataPesagem: true },
      }),
    ]);
    return {
      animals: animals.map((animal) => ({
        id: animal.id,
        batchId: animal.loteId,
        batchName: animal.lote.descricao,
        pastureId: animal.pastoId,
        pastureName: animal.pasto.descricao,
        currentWeight: decimal(animal.pesoAtual),
      })),
      measurements: measurements.map((measurement) => ({
        id: measurement.id,
        animalId: measurement.animalId,
        weight: decimal(measurement.peso) ?? 0,
        measuredAt: measurement.dataPesagem,
      })),
    };
  }
}
