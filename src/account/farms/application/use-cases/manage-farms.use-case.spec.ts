import { ExecutionContextStore } from '../../../../common/context';
import type {
  CreateFarmRecord,
  FarmRepository,
  FarmView,
  UpdateFarmRecord,
} from '../ports/farm.repository';
import type {
  FarmAccessRepository,
  FarmSessionIssuer,
} from '../ports/farm-session.ports';
import { FarmHierarchyPolicy } from '../../domain/farm-hierarchy.policy';
import { CreateFarmUseCase } from './create-farm.use-case';
import { DeactivateFarmUseCase } from './deactivate-farm.use-case';
import { ListFarmsUseCase } from './list-farms.use-case';
import { SelectFarmUseCase } from './select-farm.use-case';
import { UpdateFarmUseCase } from './update-farm.use-case';

const ROOT_FARM: FarmView = {
  id: 10,
  name: 'Fazenda Matriz',
  parentId: null,
  active: true,
};

const CHILD_FARM: FarmView = {
  id: 20,
  name: 'Fazenda Sul',
  parentId: 10,
  active: true,
};

const INACTIVE_FARM: FarmView = {
  id: 30,
  name: 'Fazenda Inativa',
  parentId: null,
  active: false,
};

class InMemoryFarmRepository implements FarmRepository {
  readonly createInputs: CreateFarmRecord[] = [];
  readonly updateInputs: Array<{ id: number; input: UpdateFarmRecord }> = [];
  readonly deactivatedIds: number[] = [];
  readonly farms = new Map<number, FarmView>([
    [ROOT_FARM.id, ROOT_FARM],
    [CHILD_FARM.id, CHILD_FARM],
    [INACTIVE_FARM.id, INACTIVE_FARM],
  ]);

  listHierarchy() {
    return Promise.resolve(
      [...this.farms.values()].map(({ id, parentId, active }) => ({
        id,
        parentId,
        active,
      })),
    );
  }

  listAccessible(farmIds: readonly number[]): Promise<readonly FarmView[]> {
    return Promise.resolve(
      farmIds
        .map((id) => this.farms.get(id))
        .filter((farm): farm is FarmView => farm !== undefined && farm.active),
    );
  }

  findAccessible(
    id: number,
    farmIds: readonly number[],
  ): Promise<FarmView | null> {
    if (!farmIds.includes(id)) return Promise.resolve(null);
    return Promise.resolve(this.farms.get(id) ?? null);
  }

  create(input: CreateFarmRecord): Promise<FarmView> {
    this.createInputs.push(input);
    const created: FarmView = {
      id: 40,
      name: input.name,
      parentId: input.parentId,
      active: true,
    };
    this.farms.set(created.id, created);
    return Promise.resolve(created);
  }

  update(id: number, input: UpdateFarmRecord): Promise<FarmView> {
    this.updateInputs.push({ id, input });
    const current = this.farms.get(id);
    if (!current) throw new Error('test fixture farm missing');
    const updated = { ...current, ...input };
    this.farms.set(id, updated);
    return Promise.resolve(updated);
  }

  deactivate(id: number): Promise<FarmView> {
    this.deactivatedIds.push(id);
    const current = this.farms.get(id);
    if (!current) throw new Error('test fixture farm missing');
    const deactivated = { ...current, active: false };
    this.farms.set(id, deactivated);
    return Promise.resolve(deactivated);
  }
}

const TENANT_CONTEXT = {
  requestId: 'request-a',
  traceId: 'trace-a',
  contextType: 'tenant' as const,
  startedAt: 1,
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: 7,
  farmId: 10,
  accessibleFarmIds: [10, 20],
  permissions: ['farms:read', 'farms:manage'],
};

describe('farm management use cases', () => {
  let context: ExecutionContextStore;
  let farms: InMemoryFarmRepository;
  let accesses: jest.Mocked<FarmAccessRepository>;
  let sessions: jest.Mocked<FarmSessionIssuer>;

  beforeEach(() => {
    context = new ExecutionContextStore();
    farms = new InMemoryFarmRepository();
    accesses = { findActiveAccess: jest.fn() };
    sessions = { sign: jest.fn() };
  });

  it('creates an active farm for the verified local owner', async () => {
    const useCase = new CreateFarmUseCase(
      farms,
      new FarmHierarchyPolicy(),
      context,
    );

    const result = await context.run(TENANT_CONTEXT, () =>
      useCase.execute({ name: 'Fazenda Norte', parentId: 10 }),
    );

    expect(result).toEqual({
      id: 40,
      name: 'Fazenda Norte',
      parentId: 10,
      active: true,
    });
    expect(farms.createInputs).toEqual([
      { name: 'Fazenda Norte', parentId: 10, ownerLocalUserId: 7 },
    ]);
  });

  it('rejects creating a farm below another child', async () => {
    const useCase = new CreateFarmUseCase(
      farms,
      new FarmHierarchyPolicy(),
      context,
    );

    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.execute({ name: 'Neta inválida', parentId: 20 }),
      ),
    ).rejects.toMatchObject({ code: 'invalidFarmHierarchy' });
    expect(farms.createInputs).toEqual([]);
  });

  it('lists only active farms authorized by the current context', async () => {
    const useCase = new ListFarmsUseCase(farms, context);

    const result = await context.run(TENANT_CONTEXT, () => useCase.execute());

    expect(result).toEqual([ROOT_FARM, CHILD_FARM]);
  });

  it('updates an accessible active farm', async () => {
    const useCase = new UpdateFarmUseCase(
      farms,
      new FarmHierarchyPolicy(),
      context,
    );

    const result = await context.run(TENANT_CONTEXT, () =>
      useCase.execute({ farmId: 20, name: 'Fazenda Sul Renovada' }),
    );

    expect(result.name).toBe('Fazenda Sul Renovada');
    expect(farms.updateInputs).toEqual([
      { id: 20, input: { name: 'Fazenda Sul Renovada' } },
    ]);
  });

  it('rejects an update outside accessibleFarmIds', async () => {
    const useCase = new UpdateFarmUseCase(
      farms,
      new FarmHierarchyPolicy(),
      context,
    );

    await expect(
      context.run(TENANT_CONTEXT, () =>
        useCase.execute({ farmId: 30, name: 'Não autorizado' }),
      ),
    ).rejects.toMatchObject({ code: 'farmAccessDenied' });
    expect(farms.updateInputs).toEqual([]);
  });

  it('issues a replacement session from persisted access for the selected farm', async () => {
    accesses.findActiveAccess.mockResolvedValue({
      farmId: 20,
      role: 'GESTOR',
      permissions: ['farms:read'],
    });
    sessions.sign.mockResolvedValue({
      accessToken: 'selected-farm-token',
      expiresIn: 3600,
    });
    const useCase = new SelectFarmUseCase(farms, accesses, sessions, context);

    const result = await context.run(TENANT_CONTEXT, () =>
      useCase.execute({ farmId: 20 }),
    );

    expect(accesses.findActiveAccess.mock.calls).toEqual([[7, 20]]);
    expect(sessions.sign.mock.calls).toEqual([
      [
        {
          globalUserId: TENANT_CONTEXT.globalUserId,
          tenantId: TENANT_CONTEXT.tenantId,
          organizationId: TENANT_CONTEXT.organizationId,
          schemaName: { value: TENANT_CONTEXT.schemaName },
          localUserId: 7,
          farmId: 20,
          role: 'GESTOR',
          permissions: ['farms:read'],
        },
      ],
    ]);
    expect(result).toEqual({
      accessToken: 'selected-farm-token',
      expiresIn: 3600,
    });
  });

  it('rejects selection when persisted access is inactive or absent', async () => {
    accesses.findActiveAccess.mockResolvedValue(null);
    const useCase = new SelectFarmUseCase(farms, accesses, sessions, context);

    await expect(
      context.run(TENANT_CONTEXT, () => useCase.execute({ farmId: 20 })),
    ).rejects.toMatchObject({ code: 'farmAccessDenied' });
    expect(sessions.sign.mock.calls).toHaveLength(0);
  });

  it('rejects selection of an inactive farm before issuing a session', async () => {
    const inactiveContext = {
      ...TENANT_CONTEXT,
      accessibleFarmIds: [...TENANT_CONTEXT.accessibleFarmIds, 30],
    };
    const useCase = new SelectFarmUseCase(farms, accesses, sessions, context);

    await expect(
      context.run(inactiveContext, () => useCase.execute({ farmId: 30 })),
    ).rejects.toMatchObject({ code: 'farmInactive' });
    expect(accesses.findActiveAccess.mock.calls).toHaveLength(0);
    expect(sessions.sign.mock.calls).toHaveLength(0);
  });

  it('soft-deactivates an accessible farm that is not currently selected', async () => {
    const useCase = new DeactivateFarmUseCase(farms, context);

    const result = await context.run(TENANT_CONTEXT, () =>
      useCase.execute({ farmId: 20 }),
    );

    expect(result).toEqual({ ...CHILD_FARM, active: false });
    expect(farms.deactivatedIds).toEqual([20]);
  });

  it('rejects deactivation of the currently selected farm', async () => {
    const useCase = new DeactivateFarmUseCase(farms, context);

    await expect(
      context.run(TENANT_CONTEXT, () => useCase.execute({ farmId: 10 })),
    ).rejects.toMatchObject({ code: 'farmSelectedCannotDeactivate' });
    expect(farms.deactivatedIds).toEqual([]);
  });
});
