import { ExecutionContextStore } from '../../../../common/context';
import type {
  BatchView,
  BreedView,
  CreateBatchRecord,
  HerdCatalogRepository,
  Page,
  PageRequest,
  UpdateDescriptionRecord,
} from '../ports/herd-catalog.repository';
import { ManageHerdCatalogUseCase } from './manage-herd-catalog.use-case';

const TENANT_CONTEXT = {
  requestId: 'request-herd-catalog',
  traceId: 'trace-herd-catalog',
  contextType: 'tenant' as const,
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId: 10,
  accessibleFarmIds: [10, 20],
  permissions: ['racas:gerenciar', 'lotes:gerenciar'],
};

const BREED: BreedView = {
  id: 1,
  description: 'Nelore',
  active: true,
};

const BATCH: BatchView = {
  id: 2,
  farmId: 10,
  description: 'Engorda',
  active: true,
};

class InMemoryHerdCatalogRepository implements HerdCatalogRepository {
  readonly breedCreates: string[] = [];
  readonly batchCreates: CreateBatchRecord[] = [];
  readonly breedUpdates: Array<{ id: number; input: UpdateDescriptionRecord }> =
    [];
  readonly batchUpdates: Array<{
    id: number;
    farmId: number;
    input: UpdateDescriptionRecord;
  }> = [];
  readonly breedDeactivations: number[] = [];
  readonly batchDeactivations: Array<{ id: number; farmId: number }> = [];
  breedHasActiveAnimals = false;
  batchHasActiveAnimals = false;

  listBreeds(request: PageRequest): Promise<Page<BreedView>> {
    return Promise.resolve({ data: [BREED], total: 1, ...request });
  }

  findBreed(id: number): Promise<BreedView | null> {
    return Promise.resolve(id === BREED.id ? BREED : null);
  }

  createBreed(description: string): Promise<BreedView> {
    this.breedCreates.push(description);
    return Promise.resolve({ ...BREED, description });
  }

  updateBreed(id: number, input: UpdateDescriptionRecord): Promise<BreedView> {
    this.breedUpdates.push({ id, input });
    return Promise.resolve({ ...BREED, id, description: input.description });
  }

  hasActiveAnimalsForBreed(): Promise<boolean> {
    return Promise.resolve(this.breedHasActiveAnimals);
  }

  deactivateBreed(id: number): Promise<BreedView> {
    this.breedDeactivations.push(id);
    return Promise.resolve({ ...BREED, id, active: false });
  }

  listBatches(farmId: number, request: PageRequest): Promise<Page<BatchView>> {
    return Promise.resolve({
      data: [{ ...BATCH, farmId }],
      total: 1,
      ...request,
    });
  }

  findBatch(id: number, farmId: number): Promise<BatchView | null> {
    return Promise.resolve(
      id === BATCH.id && farmId === BATCH.farmId ? BATCH : null,
    );
  }

  createBatch(input: CreateBatchRecord): Promise<BatchView> {
    this.batchCreates.push(input);
    return Promise.resolve({ ...BATCH, ...input });
  }

  updateBatch(
    id: number,
    farmId: number,
    input: UpdateDescriptionRecord,
  ): Promise<BatchView> {
    this.batchUpdates.push({ id, farmId, input });
    return Promise.resolve({
      ...BATCH,
      id,
      farmId,
      description: input.description,
    });
  }

  hasActiveAnimalsForBatch(): Promise<boolean> {
    return Promise.resolve(this.batchHasActiveAnimals);
  }

  deactivateBatch(id: number, farmId: number): Promise<BatchView> {
    this.batchDeactivations.push({ id, farmId });
    return Promise.resolve({ ...BATCH, id, farmId, active: false });
  }
}

describe('herd catalog management', () => {
  let context: ExecutionContextStore;
  let repository: InMemoryHerdCatalogRepository;
  let useCase: ManageHerdCatalogUseCase;

  beforeEach(() => {
    context = new ExecutionContextStore();
    repository = new InMemoryHerdCatalogRepository();
    useCase = new ManageHerdCatalogUseCase(repository, context);
  });

  it('normalizes required descriptions when creating breeds and batches', async () => {
    await context.run(TENANT_CONTEXT, () =>
      useCase.createBreed({ description: '  Nelore  ' }),
    );
    await context.run(TENANT_CONTEXT, () =>
      useCase.createBatch({ description: '  Recria  ' }),
    );

    expect(repository.breedCreates).toEqual(['Nelore']);
    expect(repository.batchCreates).toEqual([
      { farmId: 10, description: 'Recria' },
    ]);
  });

  it('rejects blank descriptions before persistence', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.createBreed({ description: '   ' }),
      ),
    ).rejects.toMatchObject({ code: 'validationFailed' });
    expect(repository.breedCreates).toEqual([]);
  });

  it('returns deterministic paginated breed and selected-farm batch lists', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.listBreeds({ page: 2, limit: 10 }),
      ),
    ).resolves.toEqual({ data: [BREED], page: 2, limit: 10, total: 1 });
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.listBatches({ page: 3, limit: 5 }),
      ),
    ).resolves.toEqual({ data: [BATCH], page: 3, limit: 5, total: 1 });
  });

  it('loads and updates only a batch from the selected farm', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.getBatch({ id: 2 })),
    ).resolves.toEqual(BATCH);
    await context.run(TENANT_CONTEXT, () =>
      useCase.updateBatch({ id: 2, description: '  Terminação  ' }),
    );
    expect(repository.batchUpdates).toEqual([
      { id: 2, farmId: 10, input: { description: 'Terminação' } },
    ]);
  });

  it('reports missing breed and farm-scoped batch with stable domain errors', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.getBreed({ id: 999 })),
    ).rejects.toMatchObject({ code: 'breedNotFound' });
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.getBatch({ id: 999 })),
    ).rejects.toMatchObject({ code: 'batchNotFound' });
  });

  it('prevents deactivating a breed referenced by an active animal', async () => {
    repository.breedHasActiveAnimals = true;
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.deactivateBreed({ id: 1 })),
    ).rejects.toMatchObject({ code: 'resourceInUse' });
    expect(repository.breedDeactivations).toEqual([]);
  });

  it('prevents deactivating a batch referenced by an active animal in the selected farm', async () => {
    repository.batchHasActiveAnimals = true;
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.deactivateBatch({ id: 2 })),
    ).rejects.toMatchObject({ code: 'resourceInUse' });
    expect(repository.batchDeactivations).toEqual([]);
  });
});
