import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  AnimalWeightScope,
  CorrectWeightRecord,
  CreateWeightRecord,
  WeightListInput,
  WeightMeasurementPage,
  WeightMeasurementView,
  WeightRepository,
} from '../application/ports/weight.repository';

const WEIGHT_SELECT = {
  id: true,
  fazendaId: true,
  animalId: true,
  peso: true,
  dataPesagem: true,
  observacao: true,
  ativa: true,
  corrigePesagemId: true,
  motivoCorrecao: true,
  registradoPorId: true,
  createdAt: true,
} as const;

type PersistedWeight = Prisma.PesagemGetPayload<{
  select: typeof WEIGHT_SELECT;
}>;

const decimalNumber = (value: { toString(): string }): number =>
  Number(value.toString());

const toWeight = (value: PersistedWeight): WeightMeasurementView => ({
  id: value.id,
  farmId: value.fazendaId,
  animalId: value.animalId,
  weight: decimalNumber(value.peso),
  measuredAt: value.dataPesagem.toISOString().slice(0, 10),
  note: value.observacao,
  active: value.ativa,
  correctsMeasurementId: value.corrigePesagemId,
  correctionReason: value.motivoCorrecao,
  registeredById: value.registradoPorId,
  createdAt: value.createdAt.toISOString(),
});

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

@Injectable()
export class PrismaWeightRepository implements WeightRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async list(
    farmId: number,
    input: WeightListInput,
  ): Promise<WeightMeasurementPage> {
    const client = this.tenantPrisma.getClient();
    const where = {
      fazendaId: farmId,
      ...(input.animalId === undefined ? {} : { animalId: input.animalId }),
    };
    const [values, total] = await Promise.all([
      client.pesagem.findMany({
        where,
        orderBy: [{ dataPesagem: 'desc' }, { id: 'desc' }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: WEIGHT_SELECT,
      }),
      client.pesagem.count({ where }),
    ]);
    return {
      data: values.map(toWeight),
      page: input.page,
      limit: input.limit,
      total,
    };
  }

  async find(
    id: number,
    farmId: number,
  ): Promise<WeightMeasurementView | null> {
    const value = await this.tenantPrisma.getClient().pesagem.findFirst({
      where: { id, fazendaId: farmId },
      select: WEIGHT_SELECT,
    });
    return value ? toWeight(value) : null;
  }

  async findAnimal(
    animalId: number,
    farmId: number,
  ): Promise<AnimalWeightScope | null> {
    const value = await this.tenantPrisma.getClient().animal.findFirst({
      where: { id: animalId, fazendaId: farmId, ativo: true },
      select: { id: true, fazendaId: true, dataEntrada: true, ativo: true },
    });
    return value
      ? {
          id: value.id,
          farmId: value.fazendaId,
          entryDate: value.dataEntrada,
          active: value.ativo,
        }
      : null;
  }

  async create(input: CreateWeightRecord): Promise<WeightMeasurementView> {
    return this.tenantPrisma.getClient().$transaction(async (transaction) => {
      const measurement = await transaction.pesagem.create({
        data: {
          fazendaId: input.farmId,
          animalId: input.animalId,
          registradoPorId: input.registeredById,
          peso: input.weight,
          dataPesagem: input.measuredAt,
          observacao: input.note,
          ativa: true,
        },
        select: WEIGHT_SELECT,
      });
      await this.recalculateCurrentWeight(transaction, input);
      return toWeight(measurement);
    });
  }

  async correct(input: CorrectWeightRecord): Promise<WeightMeasurementView> {
    try {
      return await this.tenantPrisma
        .getClient()
        .$transaction(async (transaction) => {
          const invalidated = await transaction.pesagem.updateMany({
            where: {
              id: input.previousMeasurementId,
              fazendaId: input.farmId,
              animalId: input.animalId,
              ativa: true,
            },
            data: { ativa: false },
          });
          if (invalidated.count !== 1) {
            throw this.correctionConflict();
          }

          const correction = await transaction.pesagem.create({
            data: {
              fazendaId: input.farmId,
              animalId: input.animalId,
              registradoPorId: input.registeredById,
              peso: input.weight,
              dataPesagem: input.measuredAt,
              observacao: input.note,
              ativa: true,
              corrigePesagemId: input.previousMeasurementId,
              motivoCorrecao: input.correctionReason,
            },
            select: WEIGHT_SELECT,
          });
          await this.recalculateCurrentWeight(transaction, input);
          return toWeight(correction);
        });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw this.correctionConflict(error);
      }
      throw error;
    }
  }

  private async recalculateCurrentWeight(
    transaction: Prisma.TransactionClient,
    input: { farmId: number; animalId: number },
  ): Promise<void> {
    const latest = await transaction.pesagem.findFirst({
      where: {
        fazendaId: input.farmId,
        animalId: input.animalId,
        ativa: true,
      },
      orderBy: [{ dataPesagem: 'desc' }, { id: 'desc' }],
      select: { peso: true },
    });
    if (!latest) {
      throw new DomainError(
        'internalServerError',
        'Não foi possível recalcular o peso atual do animal.',
      );
    }

    const updated = await transaction.animal.updateMany({
      where: { id: input.animalId, fazendaId: input.farmId, ativo: true },
      data: { pesoAtual: decimalNumber(latest.peso) },
    });
    if (updated.count !== 1) {
      throw new DomainError('animalNotFound', 'Animal não encontrado.');
    }
  }

  private correctionConflict(cause?: unknown): DomainError {
    return new DomainError(
      'conflict',
      'A pesagem já foi corrigida por outra operação.',
      undefined,
      cause,
    );
  }
}
