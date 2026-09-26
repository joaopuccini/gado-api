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
  fazendaId: 10,
  loteId: 2,
  racaId: 3,
  pastoId: 4,
  clienteId: null,
  nome: 'Estrela',
  numeroBrinco: 'BR-001',
  sexo: 'FEMEA',
  status: 'ATIVO',
  tipoEntrada: 'NASCIMENTO',
  nascimento: '2025-09-01',
  dataEntrada: '2025-09-01',
  pesoEntrada: 32.5,
  pesoAtual: 32.5,
  precoKilo: null,
  valorCompra: null,
  valorCustoTotal: 0,
  matriz: true,
  castrado: false,
  observacao: null,
  ativo: true,
};

class InMemoryAnimalRepository implements AnimalRepository {
  readonly creates: CreateAnimalRecord[] = [];
  readonly updates: Array<{
    id: number;
    fazendaId: number;
    input: UpdateAnimalRecord;
  }> = [];
  readonly deactivations: Array<{ id: number; fazendaId: number }> = [];
  relationsValid = true;

  list(fazendaId: number, page: number, limit: number): Promise<AnimalPage> {
    return Promise.resolve({
      data: [{ ...ANIMAL, fazendaId }],
      page,
      limit,
      total: 1,
    });
  }

  find(id: number, fazendaId: number): Promise<AnimalView | null> {
    return Promise.resolve(
      id === ANIMAL.id && fazendaId === ANIMAL.fazendaId ? ANIMAL : null,
    );
  }

  validateRelations(): Promise<boolean> {
    return Promise.resolve(this.relationsValid);
  }

  create(input: CreateAnimalRecord): Promise<AnimalView> {
    this.creates.push(input);
    return Promise.resolve({ ...ANIMAL, ...input, id: 1, ativo: true });
  }

  update(
    id: number,
    fazendaId: number,
    input: UpdateAnimalRecord,
  ): Promise<AnimalView> {
    this.updates.push({ id, fazendaId, input });
    return Promise.resolve({ ...ANIMAL, ...input });
  }

  deactivate(id: number, fazendaId: number): Promise<AnimalView> {
    this.deactivations.push({ id, fazendaId });
    return Promise.resolve({ ...ANIMAL, ativo: false });
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
        loteId: 2,
        racaId: 3,
        pastoId: 4,
        nome: '  Estrela  ',
        numeroBrinco: ' br-001 ',
        sexo: 'FEMEA',
        tipoEntrada: 'NASCIMENTO',
        nascimento: '2025-09-01',
        dataEntrada: '2025-09-01',
        pesoEntrada: 32.5,
        matriz: true,
      }),
    );

    expect(repository.creates).toEqual([
      expect.objectContaining({
        fazendaId: 10,
        registradoPorId: 7,
        nome: 'Estrela',
        numeroBrinco: 'BR-001',
        status: 'ATIVO',
        pesoAtual: 32.5,
      }),
    ]);
  });

  it('rejects invalid enum combinations before persistence', async () => {
    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.create({
          loteId: 2,
          racaId: 3,
          pastoId: 4,
          sexo: 'INVALIDO' as 'MACHO',
          tipoEntrada: 'NASCIMENTO',
          dataEntrada: '2025-09-01',
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
          loteId: 22,
          racaId: 3,
          pastoId: 4,
          sexo: 'MACHO',
          tipoEntrada: 'COMPRA_OLHO',
          dataEntrada: '2025-09-01',
          valorCompra: 2500,
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
      context.run({ ...TENANT_CONTEXT, farmId: 20 }, () =>
        useCase.get({ id: 1 }),
      ),
    ).rejects.toMatchObject({ code: 'animalNotFound' });
  });

  it('updates camelCase fields and deactivates within the selected farm', async () => {
    await context.run(TENANT_CONTEXT, () =>
      useCase.update({
        id: 1,
        nome: '  Lua  ',
        pesoAtual: 410.25,
        status: 'ATIVO',
      }),
    );
    await context.run(TENANT_CONTEXT, () => useCase.deactivate({ id: 1 }));

    expect(repository.updates).toEqual([
      {
        id: 1,
        fazendaId: 10,
        input: { nome: 'Lua', pesoAtual: 410.25, status: 'ATIVO' },
      },
    ]);
    expect(repository.deactivations).toEqual([{ id: 1, fazendaId: 10 }]);
  });
});
