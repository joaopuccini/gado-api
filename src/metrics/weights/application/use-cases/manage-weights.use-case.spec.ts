import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type {
  AnimalWeightScope,
  CorrectWeightRecord,
  CreateWeightRecord,
  WeightMeasurementPage,
  WeightMeasurementView,
  WeightRepository,
} from '../ports/weight.repository';
import { ManageWeightsUseCase } from './manage-weights.use-case';

const TENANT_CONTEXT = {
  requestId: 'request-weight',
  traceId: 'trace-weight',
  contextType: 'tenant' as const,
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId: 10,
  accessibleFarmIds: [10, 20],
  permissions: ['pesagens:gerenciar'],
};

const ANIMAL: AnimalWeightScope = {
  id: 30,
  farmId: 10,
  entryDate: new Date('2026-01-10T00:00:00.000Z'),
  active: true,
};

const MEASUREMENT: WeightMeasurementView = {
  id: 40,
  farmId: 10,
  animalId: 30,
  weight: 450.125,
  measuredAt: '2026-09-20',
  note: 'Curral principal',
  active: true,
  correctsMeasurementId: null,
  correctionReason: null,
  registeredById: 7,
  createdAt: '2026-09-20T12:00:00.000Z',
};

class InMemoryWeightRepository implements WeightRepository {
  readonly creates: CreateWeightRecord[] = [];
  readonly corrections: CorrectWeightRecord[] = [];
  readonly calls: string[] = [];
  animal: AnimalWeightScope | null = ANIMAL;
  measurement: WeightMeasurementView | null = MEASUREMENT;
  correctionConflict = false;

  list(
    farmId: number,
    input: { animalId?: number; page: number; limit: number },
  ): Promise<WeightMeasurementPage> {
    this.calls.push(`list:${farmId}:${input.animalId ?? 'all'}`);
    return Promise.resolve({
      data: this.measurement ? [this.measurement] : [],
      page: input.page,
      limit: input.limit,
      total: this.measurement ? 1 : 0,
    });
  }

  find(id: number, farmId: number): Promise<WeightMeasurementView | null> {
    this.calls.push(`find:${farmId}:${id}`);
    return Promise.resolve(
      this.measurement?.id === id && this.measurement.farmId === farmId
        ? this.measurement
        : null,
    );
  }

  findAnimal(
    animalId: number,
    farmId: number,
  ): Promise<AnimalWeightScope | null> {
    this.calls.push(`animal:${farmId}:${animalId}`);
    return Promise.resolve(
      this.animal?.id === animalId && this.animal.farmId === farmId
        ? this.animal
        : null,
    );
  }

  create(input: CreateWeightRecord): Promise<WeightMeasurementView> {
    this.creates.push(input);
    return Promise.resolve({
      ...MEASUREMENT,
      animalId: input.animalId,
      farmId: input.farmId,
      weight: input.weight,
      measuredAt: input.measuredAt.toISOString().slice(0, 10),
      note: input.note,
      registeredById: input.registeredById,
    });
  }

  correct(input: CorrectWeightRecord): Promise<WeightMeasurementView> {
    if (this.correctionConflict) {
      return Promise.reject(
        new DomainError(
          'conflict',
          'A pesagem já foi corrigida por outra operação.',
        ),
      );
    }
    this.corrections.push(input);
    return Promise.resolve({
      ...MEASUREMENT,
      id: 41,
      weight: input.weight,
      measuredAt: input.measuredAt.toISOString().slice(0, 10),
      note: input.note,
      correctsMeasurementId: input.previousMeasurementId,
      correctionReason: input.correctionReason,
      registeredById: input.registeredById,
    });
  }
}

describe('manage weights use case', () => {
  let context: ExecutionContextStore;
  let repository: InMemoryWeightRepository;
  let useCase: ManageWeightsUseCase;

  beforeEach(() => {
    context = new ExecutionContextStore();
    repository = new InMemoryWeightRepository();
    useCase = new ManageWeightsUseCase(
      repository,
      context,
      () => new Date('2026-09-27T12:00:00.000Z'),
    );
  });

  it('lists and details measurements only under the selected farm', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.list({ animalId: 30, page: 2, limit: 10 }),
      ),
    ).resolves.toMatchObject({ page: 2, limit: 10, total: 1 });
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.get({ id: 40 })),
    ).resolves.toEqual(MEASUREMENT);
    await expect(
      context.run({ ...TENANT_CONTEXT, farmId: 20 }, () =>
        useCase.get({ id: 40 }),
      ),
    ).rejects.toMatchObject({ code: 'resourceNotFound' });

    expect(repository.calls).toContain('list:10:30');
  });

  it('registers a normalized measurement with farm and actor from context', async () => {
    await context.run(TENANT_CONTEXT, () =>
      useCase.register({
        animalId: 30,
        weight: 451.2344,
        measuredAt: '2026-09-25',
        note: '  Após jejum  ',
      }),
    );

    expect(repository.creates).toEqual([
      {
        farmId: 10,
        animalId: 30,
        registeredById: 7,
        weight: 451.234,
        measuredAt: new Date('2026-09-25T00:00:00.000Z'),
        note: 'Após jejum',
      },
    ]);
  });

  it('rejects registration when the animal is absent from the selected farm', async () => {
    repository.animal = null;

    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.register({
          animalId: 99,
          weight: 451,
          measuredAt: '2026-09-25',
        }),
      ),
    ).rejects.toMatchObject({ code: 'animalNotFound' });
    expect(repository.creates).toEqual([]);
  });

  it('rejects a measurement before the animal entry date', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.register({
          animalId: 30,
          weight: 451,
          measuredAt: '2026-01-09',
        }),
      ),
    ).rejects.toMatchObject({
      code: 'validationFailed',
      details: [{ field: 'measuredAt', reason: 'beforeAnimalEntry' }],
    });
    expect(repository.creates).toEqual([]);
  });

  it('creates an auditable correction using the original animal and active revision', async () => {
    await context.run(TENANT_CONTEXT, () =>
      useCase.correct({
        id: 40,
        weight: 449.5,
        measuredAt: '2026-09-20',
        correctionReason: '  erro de digitação  ',
        note: '  conferido  ',
      }),
    );

    expect(repository.corrections).toEqual([
      {
        farmId: 10,
        animalId: 30,
        registeredById: 7,
        previousMeasurementId: 40,
        weight: 449.5,
        measuredAt: new Date('2026-09-20T00:00:00.000Z'),
        correctionReason: 'erro de digitação',
        note: 'conferido',
      },
    ]);
  });

  it('rejects correction without a reason or for an inactive revision', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.correct({
          id: 40,
          weight: 449.5,
          measuredAt: '2026-09-20',
          correctionReason: '   ',
        }),
      ),
    ).rejects.toMatchObject({ code: 'validationFailed' });

    repository.measurement = { ...MEASUREMENT, active: false };
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.correct({
          id: 40,
          weight: 449.5,
          measuredAt: '2026-09-20',
          correctionReason: 'novo ajuste',
        }),
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(repository.corrections).toEqual([]);
  });

  it('surfaces a logical concurrency conflict without creating a second correction', async () => {
    repository.correctionConflict = true;

    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.correct({
          id: 40,
          weight: 449.5,
          measuredAt: '2026-09-20',
          correctionReason: 'ajuste concorrente',
        }),
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(repository.corrections).toEqual([]);
  });

  it('fails before repository access when the tenant context is absent', async () => {
    await expect(
      useCase.register({
        animalId: 30,
        weight: 451,
        measuredAt: '2026-09-25',
      }),
    ).rejects.toMatchObject({ code: 'executionContextMissing' });
    expect(repository.calls).toEqual([]);
    expect(repository.creates).toEqual([]);
  });
});
