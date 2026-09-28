import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  AnimalLocation,
  AnimalMovementView,
  AtomicMovementRecord,
  MovementHistoryPage,
  MovementHistoryRequest,
  MovementUnitOfWork,
} from '../application/ports/movement.unit-of-work';

const TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5_000,
  timeout: 10_000,
} as const;
const MAX_TRANSACTION_ATTEMPTS = 3;

const MOVEMENT_SELECT = {
  id: true,
  fazendaId: true,
  animalId: true,
  registradoPorId: true,
  dataMovimento: true,
  observacao: true,
  createdAt: true,
} as const;

const isP2034 = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2034';

const movementDate = (value: string): Date =>
  new Date(`${value}T00:00:00.000Z`);

type MovementBase = {
  id: number;
  fazendaId: number;
  animalId: number;
  registradoPorId: number | null;
  dataMovimento: Date;
  observacao: string | null;
  createdAt: Date;
};

const toView = (
  value: MovementBase,
  kind: 'pasture' | 'batch',
  originId: number,
  destinationId: number,
): AnimalMovementView => ({
  id: value.id,
  kind,
  farmId: value.fazendaId,
  animalId: value.animalId,
  originId,
  destinationId,
  registeredById: value.registradoPorId,
  movementDate: value.dataMovimento.toISOString().slice(0, 10),
  notes: value.observacao,
  createdAt: value.createdAt.toISOString(),
});

@Injectable()
export class PrismaMovementUnitOfWork implements MovementUnitOfWork {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findAnimalLocation(
    animalId: number,
    farmId: number,
  ): Promise<AnimalLocation | null> {
    const animal = await this.tenantPrisma.getClient().animal.findFirst({
      where: { id: animalId, fazendaId: farmId, ativo: true },
      select: {
        id: true,
        fazendaId: true,
        pastoId: true,
        loteId: true,
        ativo: true,
      },
    });
    return animal
      ? {
          animalId: animal.id,
          farmId: animal.fazendaId,
          pastureId: animal.pastoId,
          batchId: animal.loteId,
          active: animal.ativo,
        }
      : null;
  }

  moveAtomically(input: AtomicMovementRecord): Promise<AnimalMovementView> {
    return this.withConflictRetry((transaction) =>
      input.kind === 'pasture'
        ? this.moveToPasture(transaction, input)
        : this.moveToBatch(transaction, input),
    );
  }

  async listHistory(
    farmId: number,
    request: MovementHistoryRequest,
  ): Promise<MovementHistoryPage> {
    const client = this.tenantPrisma.getClient();
    const where = {
      fazendaId: farmId,
      ...(request.animalId === undefined ? {} : { animalId: request.animalId }),
    };
    const [pastures, batches] = await Promise.all([
      request.kind === 'batch'
        ? Promise.resolve([])
        : client.movimentoPasto.findMany({
            where,
            select: {
              ...MOVEMENT_SELECT,
              pastoOrigemId: true,
              pastoDestinoId: true,
            },
          }),
      request.kind === 'pasture'
        ? Promise.resolve([])
        : client.movimentoLote.findMany({
            where,
            select: {
              ...MOVEMENT_SELECT,
              loteOrigemId: true,
              loteDestinoId: true,
            },
          }),
    ]);
    const values = [
      ...pastures.map((value) =>
        toView(value, 'pasture', value.pastoOrigemId, value.pastoDestinoId),
      ),
      ...batches.map((value) =>
        toView(value, 'batch', value.loteOrigemId, value.loteDestinoId),
      ),
    ].sort(
      (left, right) =>
        right.movementDate.localeCompare(left.movementDate) ||
        right.createdAt.localeCompare(left.createdAt) ||
        right.id - left.id,
    );
    const totalItems = values.length;
    const offset = (request.page - 1) * request.pageSize;
    return {
      data: values.slice(offset, offset + request.pageSize),
      page: request.page,
      pageSize: request.pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / request.pageSize),
    };
  }

  private async withConflictRetry<T>(
    work: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const client = this.tenantPrisma.getClient();
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await client.$transaction(work, TRANSACTION_OPTIONS);
      } catch (error: unknown) {
        if (!isP2034(error) || attempt === MAX_TRANSACTION_ATTEMPTS) {
          throw error;
        }
      }
    }
    throw new DomainError('internalServerError', 'Falha transacional.');
  }

  private async moveToPasture(
    transaction: Prisma.TransactionClient,
    input: AtomicMovementRecord,
  ): Promise<AnimalMovementView> {
    const destination = await transaction.pasto.findFirst({
      where: { id: input.destinationId, fazendaId: input.farmId, ativo: true },
      select: { id: true },
    });
    if (!destination) {
      throw new DomainError('pastureNotFound', 'Pasto não encontrado.');
    }
    const updated = await transaction.animal.updateMany({
      where: {
        id: input.animalId,
        fazendaId: input.farmId,
        ativo: true,
        pastoId: input.originId,
      },
      data: { pastoId: input.destinationId },
    });
    if (updated.count !== 1) throw this.movementConflict();
    const movement = await transaction.movimentoPasto.create({
      data: {
        fazendaId: input.farmId,
        animalId: input.animalId,
        pastoOrigemId: input.originId,
        pastoDestinoId: input.destinationId,
        registradoPorId: input.registeredById,
        dataMovimento: movementDate(input.movementDate),
        observacao: input.notes,
      },
      select: MOVEMENT_SELECT,
    });
    return toView(movement, 'pasture', input.originId, input.destinationId);
  }

  private async moveToBatch(
    transaction: Prisma.TransactionClient,
    input: AtomicMovementRecord,
  ): Promise<AnimalMovementView> {
    const destination = await transaction.lote.findFirst({
      where: { id: input.destinationId, fazendaId: input.farmId, ativo: true },
      select: { id: true },
    });
    if (!destination) {
      throw new DomainError('batchNotFound', 'Lote não encontrado.');
    }
    const updated = await transaction.animal.updateMany({
      where: {
        id: input.animalId,
        fazendaId: input.farmId,
        ativo: true,
        loteId: input.originId,
      },
      data: { loteId: input.destinationId },
    });
    if (updated.count !== 1) throw this.movementConflict();
    const movement = await transaction.movimentoLote.create({
      data: {
        fazendaId: input.farmId,
        animalId: input.animalId,
        loteOrigemId: input.originId,
        loteDestinoId: input.destinationId,
        registradoPorId: input.registeredById,
        dataMovimento: movementDate(input.movementDate),
        observacao: input.notes,
      },
      select: MOVEMENT_SELECT,
    });
    return toView(movement, 'batch', input.originId, input.destinationId);
  }

  private movementConflict(): DomainError {
    return new DomainError(
      'conflict',
      'O animal foi movimentado por outra operação.',
    );
  }
}
