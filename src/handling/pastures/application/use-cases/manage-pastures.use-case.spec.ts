import { ExecutionContextStore } from '../../../../common/context';
import type {
  CreatePastureRecord,
  Page,
  PageRequest,
  PastureRepository,
  PastureView,
  UpdatePastureRecord,
} from '../ports/pasture.repository';
import { ManagePasturesUseCase } from './manage-pastures.use-case';

const TENANT_CONTEXT = {
  requestId: 'request-pastures',
  traceId: 'trace-pastures',
  contextType: 'tenant' as const,
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId: 10,
  accessibleFarmIds: [10, 20],
  permissions: ['pastos:ler', 'pastos:gerenciar'],
};

const POLYGON = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [-51.2, -22.1],
        [-51.1, -22.1],
        [-51.1, -22.2],
        [-51.2, -22.1],
      ],
    ],
  },
};

const PASTURE: PastureView = {
  id: 3,
  farmId: 10,
  description: 'Pasto Norte',
  geoJson: POLYGON,
  areaHectares: '12.500',
  active: true,
};

class InMemoryPastureRepository implements PastureRepository {
  readonly creates: CreatePastureRecord[] = [];
  readonly updates: Array<{
    id: number;
    farmId: number;
    input: UpdatePastureRecord;
  }> = [];
  readonly deactivations: Array<{ id: number; farmId: number }> = [];
  hasAnimals = false;
  hasMovements = false;

  list(farmId: number, request: PageRequest): Promise<Page<PastureView>> {
    return Promise.resolve({
      data: [{ ...PASTURE, farmId }],
      total: 1,
      ...request,
    });
  }

  findById(id: number, farmId: number): Promise<PastureView | null> {
    return Promise.resolve(
      id === PASTURE.id && farmId === PASTURE.farmId ? PASTURE : null,
    );
  }

  create(input: CreatePastureRecord): Promise<PastureView> {
    this.creates.push(input);
    return Promise.resolve({ ...PASTURE, ...input, id: PASTURE.id });
  }

  update(
    id: number,
    farmId: number,
    input: UpdatePastureRecord,
  ): Promise<PastureView> {
    this.updates.push({ id, farmId, input });
    return Promise.resolve({ ...PASTURE, id, farmId, ...input });
  }

  hasActiveAnimals(): Promise<boolean> {
    return Promise.resolve(this.hasAnimals);
  }

  hasMovementHistory(): Promise<boolean> {
    return Promise.resolve(this.hasMovements);
  }

  deactivate(id: number, farmId: number): Promise<PastureView> {
    this.deactivations.push({ id, farmId });
    return Promise.resolve({ ...PASTURE, id, farmId, active: false });
  }
}

describe('pasture management', () => {
  let context: ExecutionContextStore;
  let repository: InMemoryPastureRepository;
  let useCase: ManagePasturesUseCase;

  beforeEach(() => {
    context = new ExecutionContextStore();
    repository = new InMemoryPastureRepository();
    useCase = new ManagePasturesUseCase(repository, context);
  });

  it('normalizes a valid polygon and derives the selected farm from context', async () => {
    await context.run(TENANT_CONTEXT, () =>
      useCase.create({
        description: '  Pasto Norte  ',
        geoJson: POLYGON,
        areaHectares: '12.500',
      }),
    );

    expect(repository.creates).toEqual([
      {
        farmId: 10,
        description: 'Pasto Norte',
        geoJson: POLYGON,
        areaHectares: '12.500',
      },
    ]);
  });

  it.each([
    [
      'open ring',
      {
        ...POLYGON,
        geometry: {
          ...POLYGON.geometry,
          coordinates: [
            [
              [-51.2, -22.1],
              [-51.1, -22.1],
              [-51.1, -22.2],
            ],
          ],
        },
      },
    ],
    [
      'wrong geometry',
      { ...POLYGON, geometry: { type: 'Point', coordinates: [-51.2, -22.1] } },
    ],
  ])('rejects %s GeoJSON before persistence', async (_label, geoJson) => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.create({
          description: 'Inválido',
          geoJson,
          areaHectares: '1.000',
        }),
      ),
    ).rejects.toMatchObject({ code: 'validationFailed' });
    expect(repository.creates).toEqual([]);
  });

  it('fails closed without a verified tenant context', async () => {
    await expect(useCase.list({ page: 1, limit: 20 })).rejects.toMatchObject({
      code: 'tenantContextMissing',
    });
  });

  it('lists and loads only pastures from the selected farm', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.list({ page: 2, limit: 10 })),
    ).resolves.toEqual({ data: [PASTURE], total: 1, page: 2, limit: 10 });
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.get({ id: 3 })),
    ).resolves.toEqual(PASTURE);
    await expect(
      context.run({ ...TENANT_CONTEXT, farmId: 20 }, () =>
        useCase.get({ id: 3 }),
      ),
    ).rejects.toMatchObject({ code: 'pastureNotFound' });
  });

  it.each(['animals', 'movements'] as const)(
    'blocks deactivation when the pasture has %s',
    async (dependency) => {
      repository.hasAnimals = dependency === 'animals';
      repository.hasMovements = dependency === 'movements';

      await expect(
        context.run(TENANT_CONTEXT, () => useCase.deactivate({ id: 3 })),
      ).rejects.toMatchObject({ code: 'resourceInUse' });
      expect(repository.deactivations).toEqual([]);
    },
  );
});
