import { Prisma } from '@prisma/client';
import type { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type { AtomicMovementRecord } from '../application/ports/movement.unit-of-work';
import { PrismaMovementUnitOfWork } from './prisma-movement.unit-of-work';

const MOVEMENT: AtomicMovementRecord = {
  kind: 'pasture',
  farmId: 10,
  animalId: 5,
  originId: 3,
  destinationId: 8,
  registeredById: 7,
  movementDate: '2026-09-28',
  notes: 'Rotação',
};

const BATCH_MOVEMENT: AtomicMovementRecord = {
  ...MOVEMENT,
  kind: 'batch',
  originId: 4,
  destinationId: 9,
};

describe('PrismaMovementUnitOfWork', () => {
  it('validates destination, writes history and updates the animal using one Serializable transaction', async () => {
    const findDestination = jest.fn().mockResolvedValue({ id: 8 });
    const updateAnimal = jest.fn().mockResolvedValue({ count: 1 });
    const createHistory = jest.fn().mockResolvedValue({
      id: 11,
      fazendaId: 10,
      animalId: 5,
      pastoOrigemId: 3,
      pastoDestinoId: 8,
      registradoPorId: 7,
      dataMovimento: new Date('2026-09-28T00:00:00.000Z'),
      observacao: 'Rotação',
      createdAt: new Date('2026-09-28T12:00:00.000Z'),
    });
    const tx = {
      pasto: { findFirst: findDestination },
      animal: { updateMany: updateAnimal },
      movimentoPasto: { create: createHistory },
    };
    const transaction = jest.fn(
      (work: (client: typeof tx) => Promise<unknown>) => work(tx),
    );
    const adapter = new PrismaMovementUnitOfWork({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(adapter.moveAtomically(MOVEMENT)).resolves.toMatchObject({
      id: 11,
      kind: 'pasture',
      originId: 3,
      destinationId: 8,
    });
    expect(findDestination).toHaveBeenCalledWith({
      where: { id: 8, fazendaId: 10, ativo: true },
      select: { id: true },
    });
    expect(updateAnimal).toHaveBeenCalledWith({
      where: {
        id: 5,
        fazendaId: 10,
        ativo: true,
        pastoId: 3,
      },
      data: { pastoId: 8 },
    });
    expect(createHistory).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000,
    });
  });

  it('rolls back the current position when history persistence fails', async () => {
    const state = { pastureId: 3, movementIds: [] as number[] };
    const tx = {
      pasto: { findFirst: jest.fn().mockResolvedValue({ id: 8 }) },
      animal: {
        updateMany: jest.fn().mockImplementation(() => {
          state.pastureId = 8;
          return Promise.resolve({ count: 1 });
        }),
      },
      movimentoPasto: {
        create: jest.fn().mockRejectedValue(new Error('history failed')),
      },
    };
    const transaction = async (
      work: (client: typeof tx) => Promise<unknown>,
    ) => {
      const snapshot = { ...state, movementIds: [...state.movementIds] };
      try {
        return await work(tx);
      } catch (error: unknown) {
        state.pastureId = snapshot.pastureId;
        state.movementIds = snapshot.movementIds;
        throw error;
      }
    };
    const adapter = new PrismaMovementUnitOfWork({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(adapter.moveAtomically(MOVEMENT)).rejects.toThrow(
      'history failed',
    );
    expect(state).toEqual({ pastureId: 3, movementIds: [] });
  });

  it('rolls back and does not write history when updating the animal fails', async () => {
    const state = { pastureId: 3, movementIds: [] as number[] };
    const createHistory = jest.fn();
    const tx = {
      pasto: { findFirst: jest.fn().mockResolvedValue({ id: 8 }) },
      animal: {
        updateMany: jest.fn().mockImplementation(() => {
          state.pastureId = 8;
          return Promise.reject(new Error('animal update failed'));
        }),
      },
      movimentoPasto: { create: createHistory },
    };
    const transaction = async (
      work: (client: typeof tx) => Promise<unknown>,
    ) => {
      const snapshot = { ...state, movementIds: [...state.movementIds] };
      try {
        return await work(tx);
      } catch (error: unknown) {
        state.pastureId = snapshot.pastureId;
        state.movementIds = snapshot.movementIds;
        throw error;
      }
    };
    const adapter = new PrismaMovementUnitOfWork({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(adapter.moveAtomically(MOVEMENT)).rejects.toThrow(
      'animal update failed',
    );
    expect(state).toEqual({ pastureId: 3, movementIds: [] });
    expect(createHistory).not.toHaveBeenCalled();
  });

  it('moves batches atomically with the persisted origin guard', async () => {
    const findDestination = jest.fn().mockResolvedValue({ id: 9 });
    const updateAnimal = jest.fn().mockResolvedValue({ count: 1 });
    const createHistory = jest.fn().mockResolvedValue({
      id: 12,
      fazendaId: 10,
      animalId: 5,
      loteOrigemId: 4,
      loteDestinoId: 9,
      registradoPorId: 7,
      dataMovimento: new Date('2026-09-28T00:00:00.000Z'),
      observacao: 'Rotação',
      createdAt: new Date('2026-09-28T12:00:00.000Z'),
    });
    const tx = {
      lote: { findFirst: findDestination },
      animal: { updateMany: updateAnimal },
      movimentoLote: { create: createHistory },
    };
    const transaction = jest.fn(
      (work: (client: typeof tx) => Promise<unknown>) => work(tx),
    );
    const adapter = new PrismaMovementUnitOfWork({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(adapter.moveAtomically(BATCH_MOVEMENT)).resolves.toMatchObject(
      {
        id: 12,
        kind: 'batch',
        originId: 4,
        destinationId: 9,
      },
    );
    expect(findDestination).toHaveBeenCalledWith({
      where: { id: 9, fazendaId: 10, ativo: true },
      select: { id: true },
    });
    expect(updateAnimal).toHaveBeenCalledWith({
      where: { id: 5, fazendaId: 10, ativo: true, loteId: 4 },
      data: { loteId: 9 },
    });
    expect(createHistory).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000,
    });
  });

  it('rejects a stale origin without writing history', async () => {
    const create = jest.fn();
    const tx = {
      pasto: { findFirst: jest.fn().mockResolvedValue({ id: 8 }) },
      animal: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      movimentoPasto: { create },
    };
    const adapter = new PrismaMovementUnitOfWork({
      getClient: () => ({
        $transaction: (work: (client: typeof tx) => Promise<unknown>) =>
          work(tx),
      }),
    } as unknown as TenantPrismaService);

    await expect(adapter.moveAtomically(MOVEMENT)).rejects.toMatchObject({
      code: 'conflict',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('retries only P2034 conflicts with a bounded attempt count', async () => {
    const tx = {
      pasto: { findFirst: jest.fn().mockResolvedValue({ id: 8 }) },
      animal: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      movimentoPasto: {
        create: jest.fn().mockResolvedValue({
          id: 11,
          fazendaId: 10,
          animalId: 5,
          pastoOrigemId: 3,
          pastoDestinoId: 8,
          registradoPorId: 7,
          dataMovimento: new Date('2026-09-28'),
          observacao: null,
          createdAt: new Date('2026-09-28'),
        }),
      },
    };
    const conflict = Object.assign(new Error('conflict'), { code: 'P2034' });
    const transaction = jest
      .fn()
      .mockRejectedValueOnce(conflict)
      .mockImplementationOnce((work: (client: typeof tx) => Promise<unknown>) =>
        work(tx),
      );
    const adapter = new PrismaMovementUnitOfWork({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(adapter.moveAtomically(MOVEMENT)).resolves.toMatchObject({
      id: 11,
    });
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('normalizes an exhausted P2034 conflict without exposing Prisma', async () => {
    const conflict = Object.assign(new Error('raw prisma detail'), {
      code: 'P2034',
    });
    const transaction = jest.fn().mockRejectedValue(conflict);
    const adapter = new PrismaMovementUnitOfWork({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(adapter.moveAtomically(MOVEMENT)).rejects.toMatchObject({
      name: 'DomainError',
      code: 'conflict',
      message: 'A movimentação conflitou com outra operação.',
      cause: conflict,
    });
    expect(transaction).toHaveBeenCalledTimes(3);
  });
});
