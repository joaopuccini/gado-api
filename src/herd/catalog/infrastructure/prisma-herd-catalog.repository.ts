import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../common/errors/domain-error';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  BatchView,
  BreedView,
  CreateBatchRecord,
  HerdCatalogRepository,
  Page,
  PageRequest,
  UpdateDescriptionRecord,
} from '../application/ports/herd-catalog.repository';

const BREED_SELECT = { id: true, descricao: true, ativo: true } as const;
const BATCH_SELECT = {
  id: true,
  fazendaId: true,
  descricao: true,
  ativo: true,
} as const;

const toBreed = (value: {
  id: number;
  descricao: string;
  ativo: boolean;
}): BreedView => ({
  id: value.id,
  description: value.descricao,
  active: value.ativo,
});

const toBatch = (value: {
  id: number;
  fazendaId: number;
  descricao: string;
  ativo: boolean;
}): BatchView => ({
  id: value.id,
  farmId: value.fazendaId,
  description: value.descricao,
  active: value.ativo,
});

const offset = ({ page, limit }: PageRequest): number => (page - 1) * limit;

@Injectable()
export class PrismaHerdCatalogRepository implements HerdCatalogRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async listBreeds(request: PageRequest): Promise<Page<BreedView>> {
    const client = this.tenantPrisma.getClient();
    const [values, total] = await Promise.all([
      client.raca.findMany({
        where: { ativo: true },
        orderBy: { id: 'asc' },
        skip: offset(request),
        take: request.limit,
        select: BREED_SELECT,
      }),
      client.raca.count({ where: { ativo: true } }),
    ]);
    return { data: values.map(toBreed), total, ...request };
  }

  async findBreed(id: number): Promise<BreedView | null> {
    const value = await this.tenantPrisma.getClient().raca.findFirst({
      where: { id, ativo: true },
      select: BREED_SELECT,
    });
    return value ? toBreed(value) : null;
  }

  async createBreed(description: string): Promise<BreedView> {
    const value = await this.tenantPrisma.getClient().raca.create({
      data: { descricao: description, ativo: true },
      select: BREED_SELECT,
    });
    return toBreed(value);
  }

  async updateBreed(
    id: number,
    input: UpdateDescriptionRecord,
  ): Promise<BreedView> {
    const result = await this.tenantPrisma.getClient().raca.updateMany({
      where: { id, ativo: true },
      data: { descricao: input.description },
    });
    if (result.count !== 1) {
      throw new DomainError('breedNotFound', 'Raça não encontrada.');
    }
    return await this.requireBreed(id);
  }

  async hasActiveAnimalsForBreed(id: number): Promise<boolean> {
    const value = await this.tenantPrisma.getClient().animal.findFirst({
      where: { racaId: id, ativo: true },
      select: { id: true },
    });
    return value !== null;
  }

  async deactivateBreed(id: number): Promise<BreedView> {
    const result = await this.tenantPrisma.getClient().raca.updateMany({
      where: { id, ativo: true },
      data: { ativo: false },
    });
    if (result.count !== 1) {
      throw new DomainError('breedNotFound', 'Raça não encontrada.');
    }
    return await this.requireBreed(id, false);
  }

  async listBatches(
    farmId: number,
    request: PageRequest,
  ): Promise<Page<BatchView>> {
    const client = this.tenantPrisma.getClient();
    const where = { fazendaId: farmId, ativo: true } as const;
    const [values, total] = await Promise.all([
      client.lote.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: offset(request),
        take: request.limit,
        select: BATCH_SELECT,
      }),
      client.lote.count({ where }),
    ]);
    return { data: values.map(toBatch), total, ...request };
  }

  async findBatch(id: number, farmId: number): Promise<BatchView | null> {
    const value = await this.tenantPrisma.getClient().lote.findFirst({
      where: { id, fazendaId: farmId, ativo: true },
      select: BATCH_SELECT,
    });
    return value ? toBatch(value) : null;
  }

  async createBatch(input: CreateBatchRecord): Promise<BatchView> {
    const value = await this.tenantPrisma.getClient().lote.create({
      data: {
        fazendaId: input.farmId,
        descricao: input.description,
        ativo: true,
      },
      select: BATCH_SELECT,
    });
    return toBatch(value);
  }

  async updateBatch(
    id: number,
    farmId: number,
    input: UpdateDescriptionRecord,
  ): Promise<BatchView> {
    const result = await this.tenantPrisma.getClient().lote.updateMany({
      where: { id, fazendaId: farmId, ativo: true },
      data: { descricao: input.description },
    });
    if (result.count !== 1) {
      throw new DomainError('batchNotFound', 'Lote não encontrado.');
    }
    return await this.requireBatch(id, farmId);
  }

  async hasActiveAnimalsForBatch(id: number, farmId: number): Promise<boolean> {
    const value = await this.tenantPrisma.getClient().animal.findFirst({
      where: { loteId: id, fazendaId: farmId, ativo: true },
      select: { id: true },
    });
    return value !== null;
  }

  async deactivateBatch(id: number, farmId: number): Promise<BatchView> {
    const result = await this.tenantPrisma.getClient().lote.updateMany({
      where: { id, fazendaId: farmId, ativo: true },
      data: { ativo: false },
    });
    if (result.count !== 1) {
      throw new DomainError('batchNotFound', 'Lote não encontrado.');
    }
    return await this.requireBatch(id, farmId);
  }

  private async requireBatch(id: number, farmId: number): Promise<BatchView> {
    const value = await this.tenantPrisma.getClient().lote.findFirst({
      where: { id, fazendaId: farmId },
      select: BATCH_SELECT,
    });
    if (!value) {
      throw new DomainError('batchNotFound', 'Lote não encontrado.');
    }
    return toBatch(value);
  }

  private async requireBreed(id: number, active = true): Promise<BreedView> {
    const value = await this.tenantPrisma.getClient().raca.findFirst({
      where: { id, ativo: active },
      select: BREED_SELECT,
    });
    if (!value) {
      throw new DomainError('breedNotFound', 'Raça não encontrada.');
    }
    return toBreed(value);
  }
}
