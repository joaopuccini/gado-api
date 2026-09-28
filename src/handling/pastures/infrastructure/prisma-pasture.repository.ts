import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../common/errors/domain-error';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type { GeoJsonPolygon } from '../domain/pasture';
import { normalizePastureGeoJson } from '../domain/pasture';
import type {
  CreatePastureRecord,
  Page,
  PageRequest,
  PastureRepository,
  PastureView,
  UpdatePastureRecord,
} from '../application/ports/pasture.repository';

const SELECT = {
  id: true,
  fazendaId: true,
  descricao: true,
  geojson: true,
  tamanhoHectares: true,
  ativo: true,
} as const;

const toInputJson = (value: unknown): Prisma.InputJsonValue => {
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(toInputJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, toInputJson(child)]),
    ) as Prisma.InputJsonObject;
  }
  throw new DomainError('validationFailed', 'GeoJSON inválido.', [
    { field: 'geoJson', reason: 'jsonValueRequired' },
  ]);
};

const toJson = (value: GeoJsonPolygon): Prisma.InputJsonValue => ({
  type: value.type,
  properties: toInputJson(value.properties),
  geometry: {
    type: value.geometry.type,
    coordinates: value.geometry.coordinates.map((ring) =>
      ring.map(([longitude, latitude]) => [longitude, latitude]),
    ),
  },
});

const toView = (value: {
  id: number;
  fazendaId: number;
  descricao: string;
  geojson: Prisma.JsonValue;
  tamanhoHectares: Prisma.Decimal | null;
  ativo: boolean;
}): PastureView => ({
  id: value.id,
  farmId: value.fazendaId,
  description: value.descricao,
  geoJson: normalizePastureGeoJson(value.geojson),
  ...(value.tamanhoHectares
    ? { areaHectares: value.tamanhoHectares.toFixed(3) }
    : {}),
  active: value.ativo,
});

@Injectable()
export class PrismaPastureRepository implements PastureRepository {
  constructor(private readonly tenant: TenantPrismaService) {}

  async list(farmId: number, request: PageRequest): Promise<Page<PastureView>> {
    const client = this.tenant.getClient();
    const where = { fazendaId: farmId, ativo: true } as const;
    const [rows, total] = await Promise.all([
      client.pasto.findMany({
        where,
        select: SELECT,
        orderBy: { id: 'asc' },
        skip: (request.page - 1) * request.limit,
        take: request.limit,
      }),
      client.pasto.count({ where }),
    ]);
    return { data: rows.map(toView), total, ...request };
  }

  async findById(id: number, farmId: number): Promise<PastureView | null> {
    const row = await this.tenant.getClient().pasto.findFirst({
      where: { id, fazendaId: farmId },
      select: SELECT,
    });
    return row ? toView(row) : null;
  }

  async create(input: CreatePastureRecord): Promise<PastureView> {
    const row = await this.tenant.getClient().pasto.create({
      data: {
        fazendaId: input.farmId,
        descricao: input.description,
        geojson: toJson(input.geoJson),
        tamanhoHectares: input.areaHectares,
      },
      select: SELECT,
    });
    return toView(row);
  }

  async update(
    id: number,
    farmId: number,
    input: UpdatePastureRecord,
  ): Promise<PastureView> {
    const result = await this.tenant.getClient().pasto.updateMany({
      where: { id, fazendaId: farmId, ativo: true },
      data: {
        descricao: input.description,
        geojson: toJson(input.geoJson),
        tamanhoHectares: input.areaHectares,
      },
    });
    if (result.count !== 1) this.notFound();
    return await this.require(id, farmId);
  }

  async hasActiveAnimals(id: number, farmId: number): Promise<boolean> {
    return (
      (await this.tenant.getClient().animal.findFirst({
        where: { pastoId: id, fazendaId: farmId, ativo: true },
        select: { id: true },
      })) !== null
    );
  }

  async hasMovementHistory(id: number, farmId: number): Promise<boolean> {
    return (
      (await this.tenant.getClient().movimentoPasto.findFirst({
        where: {
          fazendaId: farmId,
          OR: [{ pastoOrigemId: id }, { pastoDestinoId: id }],
        },
        select: { id: true },
      })) !== null
    );
  }

  async deactivate(id: number, farmId: number): Promise<PastureView> {
    const result = await this.tenant.getClient().pasto.updateMany({
      where: { id, fazendaId: farmId, ativo: true },
      data: { ativo: false },
    });
    if (result.count !== 1) this.notFound();
    return await this.require(id, farmId);
  }

  private async require(id: number, farmId: number): Promise<PastureView> {
    const value = await this.findById(id, farmId);
    if (!value) this.notFound();
    return value;
  }

  private notFound(): never {
    throw new DomainError('pastureNotFound', 'Pasto não encontrado.');
  }
}
