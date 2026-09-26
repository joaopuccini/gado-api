import { ExecutionContextStore } from '../../../../common/context';
import type {
  AnimalPage,
  AnimalRepository,
  AnimalView,
  CreateAnimalRecord,
  UpdateAnimalRecord,
} from '../ports/animal.repository';
import { ManageAnimalsUseCase } from './manage-animals.use-case';

const TENANT_CONTEXT = {
  requestId: 'request-animal',
  traceId: 'trace-animal',
  contextType: 'tenant' as const,
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId: 10,
  accessibleFarmIds: [10, 20],
  permissions: ['animais:gerenciar'],
};

const ANIMAL: AnimalView = {
  id: 1,
  farmId: 10,
  batchId: 2,
  breedId: 3,
  pastureId: 4,
  clientId: null,
  name: 'Estrela',
  earTag: 'BR-001',
  sex: 'FEMEA',
  status: 'ATIVO',
  entryType: 'NASCIMENTO',
  birthDate: '2025-09-01',
  entryDate: '2025-09-01',
  entryWeight: 32.5,
  currentWeight: 32.5,
  pricePerKilo: null,
  purchaseValue: null,
  totalCost: 0,
  breedingStock: true,
  castrated: false,
  notes: null,
  active: true,
};

class InMemoryAnimalRepository implements AnimalRepository {
  readonly creates: CreateAnimalRecord[] = [];
  readonly updates: Array<{ id: number; farmId: number; input: UpdateAnimalRecord }> = [];
  readonly deactivations: Array<{ id: number; farmId: number }> = [];
  relationsValid = true;

  list(farmId: number, page: number, limit: number): Promise<AnimalPage> {
    return Promise.resolve({ data: [{ ...ANIMAL, farmId }], page, limit, total: 1 });
  }

  find(id: number, farmId: number): Promise<AnimalView | null> {
    return Promise.resolve(id === ANIMAL.id && farmId === ANIMAL.farmId ? ANIMAL : null);
  }

  validateRelations(): Promise<boolean> {
    return Promise.resolve(this.relationsValid);
  }

  create(input: CreateAnimalRecord): Promise<AnimalView> {
    this.creates.push(input);
    return Promise.resolve({ ...ANIMAL, ...input, id: 1, active: true });
  }

  update(id: number, farmId: number, input: UpdateAnimalRecord): Promise<AnimalView> {
    this.updates.push({ id, farmId, input });
    return Promise.resolve({ ...ANIMAL, ...input });
  }

  deactivate(id: number, farmId: number): Promise<AnimalView> {
    this.deactivations.push({ id, farmId });
    return Promise.resolve({ ...ANIMAL, active: false });
  }
}

describe('animal lifecycle use cases', () => {
  let context: ExecutionContextStore;
  let repository: InMemoryAnimalRepository;
  let useCase: ManageAnimalsUseCase;

  beforeEach(() => {
    context = new ExecutionContextStore();
    repository = new InMemoryAnimalRepository();
    useCase = new ManageAnimalsUseCase(repository, context);
  });

  it('creates a normalized birth record under the selected farm', async () => {
    await context.run(TENANT_CONTEXT, () =>
      useCase.create({
        batchId: 2,
        breedId: 3,
        pastureId: 4,
        name: '  Estrela  ',
        earTag: ' br-001 ',
        sex: 'FEMEA',
        entryType: 'NASCIMENTO',
        birthDate: '2025-09-01',
        entryDate: '2025-09-01',
        entryWeight: 32.5,
        breedingStock: true,
      }),
    );

    expect(repository.creates).toEqual([
      expect.objectContaining({
        farmId: 10,
        registeredById: 7,
        name: 'Estrela',
        earTag: 'BR-001',
        status: 'ATIVO',
        currentWeight: 32.5,
      }),
    ]);
  });

  it('rejects invalid enum combinations before persistence', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.create({
          batchId: 2,
          breedId: 3,
          pastureId: 4,
          sex: 'INVALIDO' as 'MACHO',
          entryType: 'NASCIMENTO',
          entryDate: '2025-09-01',
        }),
      ),
    ).rejects.toMatchObject({ code: 'validationFailed' });
    expect(repository.creates).toEqual([]);
  });

  it('rejects relations not active in the selected farm', async () => {
    repository.relationsValid = false;
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.create({
          batchId: 22,
          breedId: 3,
          pastureId: 4,
          sex: 'MACHO',
          entryType: 'COMPRA_OLHO',
          entryDate: '2025-09-01',
          purchaseValue: 2500,
        }),
      ),
    ).rejects.toMatchObject({ code: 'animalRelationUnavailable' });
  });

  it('lists and loads animals only from the selected farm', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.list({ page: 2, limit: 10 })),
    ).resolves.toMatchObject({ page: 2, limit: 10, total: 1 });
    await expect(
      context.run(TENANT_CONTEXT, () => useCase.get({ id: 1 })),
    ).resolves.toEqual(ANIMAL);
    await expect(
      context.run({ ...TENANT_CONTEXT, farmId: 20 }, () => useCase.get({ id: 1 })),
    ).rejects.toMatchObject({ code: 'animalNotFound' });
  });

  it('updates camelCase fields and deactivates within the selected farm', async () => {
    await context.run(TENANT_CONTEXT, () =>
      useCase.update({ id: 1, name: '  Lua  ', currentWeight: 410.25, status: 'ATIVO' }),
    );
    await context.run(TENANT_CONTEXT, () => useCase.deactivate({ id: 1 }));

    expect(repository.updates).toEqual([
      { id: 1, farmId: 10, input: { name: 'Lua', currentWeight: 410.25, status: 'ATIVO' } },
    ]);
    expect(repository.deactivations).toEqual([{ id: 1, farmId: 10 }]);
  });
});
