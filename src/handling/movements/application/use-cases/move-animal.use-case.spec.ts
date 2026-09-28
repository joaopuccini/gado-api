import { ExecutionContextStore } from '../../../../common/context';
import type {
  AnimalLocation,
  AtomicMovementRecord,
  MovementUnitOfWork,
} from '../ports/movement.unit-of-work';
import { MoveAnimalUseCase } from './move-animal.use-case';

const CONTEXT = {
  requestId: 'request-movement',
  traceId: 'trace-movement',
  contextType: 'tenant' as const,
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId: 10,
  accessibleFarmIds: [10],
  permissions: ['movimentacoes:criar'],
};

class InMemoryMovementUnitOfWork implements MovementUnitOfWork {
  location: AnimalLocation | null = {
    animalId: 5,
    farmId: 10,
    pastureId: 3,
    batchId: 4,
    active: true,
  };
  readonly movements: AtomicMovementRecord[] = [];
  listHistory = jest.fn().mockResolvedValue({
    data: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });

  findAnimalLocation(animalId: number, farmId: number) {
    return Promise.resolve(
      this.location?.animalId === animalId && this.location.farmId === farmId
        ? this.location
        : null,
    );
  }

  moveAtomically(input: AtomicMovementRecord) {
    this.movements.push(input);
    return Promise.resolve({ id: 11, ...input });
  }
}

describe('atomic animal movements', () => {
  let context: ExecutionContextStore;
  let unitOfWork: InMemoryMovementUnitOfWork;
  let useCase: MoveAnimalUseCase;

  beforeEach(() => {
    context = new ExecutionContextStore();
    unitOfWork = new InMemoryMovementUnitOfWork();
    useCase = new MoveAnimalUseCase(unitOfWork, context);
  });

  it('derives pasture origin and actor from persisted/contextual state', async () => {
    await context.run(CONTEXT, () =>
      useCase.toPasture({
        animalId: 5,
        destinationPastureId: 8,
        movementDate: '2026-09-28',
        notes: 'Rotação',
      }),
    );
    expect(unitOfWork.movements).toEqual([
      {
        kind: 'pasture',
        farmId: 10,
        animalId: 5,
        originId: 3,
        destinationId: 8,
        registeredById: 7,
        movementDate: '2026-09-28',
        notes: 'Rotação',
      },
    ]);
  });

  it('derives batch origin and persists one atomic command', async () => {
    await context.run(CONTEXT, () =>
      useCase.toBatch({
        animalId: 5,
        destinationBatchId: 9,
        movementDate: '2026-09-28',
      }),
    );
    expect(unitOfWork.movements[0]).toMatchObject({
      kind: 'batch',
      originId: 4,
      destinationId: 9,
    });
  });

  it('rejects same-origin destinations before opening the unit of work', async () => {
    await expect(
      context.run(CONTEXT, () =>
        useCase.toPasture({
          animalId: 5,
          destinationPastureId: 3,
          movementDate: '2026-09-28',
        }),
      ),
    ).rejects.toMatchObject({ code: 'validationFailed' });
    expect(unitOfWork.movements).toEqual([]);
  });

  it('rejects missing or cross-farm animals', async () => {
    unitOfWork.location = null;
    await expect(
      context.run(CONTEXT, () =>
        useCase.toBatch({
          animalId: 5,
          destinationBatchId: 9,
          movementDate: '2026-09-28',
        }),
      ),
    ).rejects.toMatchObject({ code: 'animalNotFound' });
    expect(unitOfWork.movements).toEqual([]);
  });

  it('fails closed when movement permission is absent', async () => {
    await expect(
      context.run({ ...CONTEXT, permissions: [] }, () =>
        useCase.toPasture({
          animalId: 5,
          destinationPastureId: 8,
          movementDate: '2026-09-28',
        }),
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(unitOfWork.movements).toEqual([]);
  });

  it('lists only authorized farm history with canonical pagination', async () => {
    unitOfWork.listHistory = jest.fn().mockResolvedValue({
      data: [],
      page: 2,
      pageSize: 5,
      totalItems: 0,
      totalPages: 0,
    });
    await expect(
      context.run({ ...CONTEXT, permissions: ['movimentacoes:ler'] }, () =>
        useCase.history({ animalId: 5, page: 2, pageSize: 5 }),
      ),
    ).resolves.toMatchObject({ page: 2, pageSize: 5 });
    expect(unitOfWork.listHistory).toHaveBeenCalledWith(10, {
      animalId: 5,
      page: 2,
      pageSize: 5,
    });
  });
});
