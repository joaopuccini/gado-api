import type { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  CorrectWeightRecord,
  CreateWeightRecord,
} from '../application/ports/weight.repository';
import { PrismaWeightRepository } from './prisma-weight.repository';

const CREATE: CreateWeightRecord = {
  farmId: 10,
  animalId: 30,
  registeredById: 7,
  weight: 450.125,
  measuredAt: new Date('2026-09-20T00:00:00.000Z'),
  note: 'Curral principal',
};

const CORRECTION: CorrectWeightRecord = {
  ...CREATE,
  weight: 449.5,
  previousMeasurementId: 40,
  correctionReason: 'Erro de digitação',
};

const persistedMeasurement = {
  id: 41,
  fazendaId: 10,
  animalId: 30,
  peso: { toString: () => '449.500' },
  dataPesagem: new Date('2026-09-20T00:00:00.000Z'),
  observacao: 'Curral principal',
  ativa: true,
  corrigePesagemId: 40,
  motivoCorrecao: 'Erro de digitação',
  registradoPorId: 7,
  createdAt: new Date('2026-09-20T12:00:00.000Z'),
};

describe('PrismaWeightRepository', () => {
  it('registers a measurement and recalculates current weight in one transaction', async () => {
    const create = jest.fn().mockResolvedValue({
      ...persistedMeasurement,
      corrigePesagemId: null,
      motivoCorrecao: null,
    });
    const findLatest = jest.fn().mockResolvedValue({
      peso: { toString: () => '500.250' },
    });
    const updateAnimal = jest.fn().mockResolvedValue({ count: 1 });
    const transactionClient = {
      pesagem: { create, findFirst: findLatest },
      animal: { updateMany: updateAnimal },
    };
    const transaction = jest.fn(
      (work: (client: typeof transactionClient) => Promise<unknown>) =>
        work(transactionClient),
    );
    const repository = new PrismaWeightRepository({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(repository.create(CREATE)).resolves.toMatchObject({
      id: 41,
      farmId: 10,
      weight: 449.5,
      active: true,
      correctsMeasurementId: null,
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        fazendaId: 10,
        animalId: 30,
        registradoPorId: 7,
        peso: 450.125,
        dataPesagem: new Date('2026-09-20T00:00:00.000Z'),
        observacao: 'Curral principal',
        ativa: true,
      },
      // Jest asymmetric matchers are typed as any by @types/jest.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      select: expect.any(Object),
    });
    expect(findLatest).toHaveBeenCalledWith({
      where: { fazendaId: 10, animalId: 30, ativa: true },
      orderBy: [{ dataPesagem: 'desc' }, { id: 'desc' }],
      select: { peso: true },
    });
    expect(updateAnimal).toHaveBeenCalledWith({
      where: { id: 30, fazendaId: 10, ativo: true },
      data: { pesoAtual: 500.25 },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('invalidates the previous revision and inserts its correction atomically', async () => {
    const invalidate = jest.fn().mockResolvedValue({ count: 1 });
    const create = jest.fn().mockResolvedValue(persistedMeasurement);
    const findLatest = jest.fn().mockResolvedValue(persistedMeasurement);
    const updateAnimal = jest.fn().mockResolvedValue({ count: 1 });
    const transactionClient = {
      pesagem: { updateMany: invalidate, create, findFirst: findLatest },
      animal: { updateMany: updateAnimal },
    };
    const repository = new PrismaWeightRepository({
      getClient: () => ({
        $transaction: (
          work: (client: typeof transactionClient) => Promise<unknown>,
        ) => work(transactionClient),
      }),
    } as unknown as TenantPrismaService);

    await expect(repository.correct(CORRECTION)).resolves.toMatchObject({
      id: 41,
      active: true,
      correctsMeasurementId: 40,
      correctionReason: 'Erro de digitação',
    });
    expect(invalidate).toHaveBeenCalledWith({
      where: { id: 40, fazendaId: 10, animalId: 30, ativa: true },
      data: { ativa: false },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        fazendaId: 10,
        animalId: 30,
        registradoPorId: 7,
        peso: 449.5,
        dataPesagem: new Date('2026-09-20T00:00:00.000Z'),
        observacao: 'Curral principal',
        ativa: true,
        corrigePesagemId: 40,
        motivoCorrecao: 'Erro de digitação',
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      select: expect.any(Object),
    });
  });

  it('rejects a concurrent correction when the active revision was already invalidated', async () => {
    const create = jest.fn();
    const transactionClient = {
      pesagem: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create,
      },
    };
    const repository = new PrismaWeightRepository({
      getClient: () => ({
        $transaction: (
          work: (client: typeof transactionClient) => Promise<unknown>,
        ) => work(transactionClient),
      }),
    } as unknown as TenantPrismaService);

    await expect(repository.correct(CORRECTION)).rejects.toMatchObject({
      code: 'conflict',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('rolls back the measurement when recalculating the animal current weight fails', async () => {
    const state: { measurements: number[] } = { measurements: [] };
    const transactionClient = {
      pesagem: {
        create: jest.fn().mockImplementation(() => {
          state.measurements.push(41);
          return Promise.resolve({
            ...persistedMeasurement,
            corrigePesagemId: null,
            motivoCorrecao: null,
          });
        }),
        findFirst: jest.fn().mockResolvedValue(persistedMeasurement),
      },
      animal: {
        updateMany: jest.fn().mockRejectedValue(new Error('write failed')),
      },
    };
    const transaction = async (
      work: (client: typeof transactionClient) => Promise<unknown>,
    ) => {
      const snapshot = [...state.measurements];
      try {
        return await work(transactionClient);
      } catch (error: unknown) {
        state.measurements = snapshot;
        throw error;
      }
    };
    const repository = new PrismaWeightRepository({
      getClient: () => ({ $transaction: transaction }),
    } as unknown as TenantPrismaService);

    await expect(repository.create(CREATE)).rejects.toThrow('write failed');
    expect(state.measurements).toEqual([]);
  });
});
