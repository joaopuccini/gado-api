import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../common/context';
import type {
  TenantMembershipRecord,
  TenantRegistryRecord,
  TenantRegistryRepository,
} from '../ports/tenant-registry.repository';
import { ResolveTenantContextUseCase } from './resolve-tenant-context.use-case';

const requestContext: ExecutionContextData = {
  requestId: 'request-a',
  traceId: 'trace-a',
  contextType: 'public',
  startedAt: Date.now(),
  accessibleFarmIds: [],
  permissions: [],
};

const activeTenant = (
  overrides: Partial<TenantRegistryRecord> = {},
): TenantRegistryRecord => ({
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_verified',
  subdomain: 'fazenda-a',
  status: 'active',
  ...overrides,
});

const membership = (
  overrides: Partial<TenantMembershipRecord> = {},
): TenantMembershipRecord => ({
  localUserId: 7,
  farms: [
    {
      farmId: 10,
      permissions: ['animals.read', 'animals.write'],
    },
  ],
  ...overrides,
});

const verifiedInput = () => ({
  verifiedSubject: 'user-a',
  tenantId: 'tenant-a',
  verifiedOrganizationId: 'organization-a',
  requestedSchemaName: 'tenant_attacker',
  requestedFarmId: 10,
  hostTenant: 'fazenda-a',
});

describe('ResolveTenantContextUseCase', () => {
  let store: ExecutionContextStore;
  let registry: jest.Mocked<TenantRegistryRepository>;
  let useCase: ResolveTenantContextUseCase;

  beforeEach(() => {
    store = new ExecutionContextStore();
    registry = {
      findById: jest.fn().mockResolvedValue(activeTenant()),
      findMembership: jest.fn().mockResolvedValue(membership()),
    };
    useCase = new ResolveTenantContextUseCase(registry, store);
  });

  const executeInRequest = (input = verifiedInput()) =>
    store.run(requestContext, () => useCase.execute(input));

  it('uses registry schema instead of schemaName claimed by the client', async () => {
    await store.run(requestContext, async () => {
      await useCase.execute(verifiedInput());
      expect(store.requireTenant()).toMatchObject({
        tenantId: 'tenant-a',
        organizationId: 'organization-a',
        schemaName: 'tenant_verified',
        globalUserId: 'user-a',
        localUserId: 7,
        farmId: 10,
        accessibleFarmIds: [10],
        permissions: ['animals.read', 'animals.write'],
      });
    });
  });

  it.each(['blocked', 'removed', 'provisioning'] as const)(
    'rejects a %s tenant',
    async (status) => {
      registry.findById.mockResolvedValue(activeTenant({ status }));

      await expect(executeInRequest()).rejects.toMatchObject({
        code: 'tenantUnavailable',
      });
      expect(registry.findMembership.mock.calls).toHaveLength(0);
    },
  );

  it('rejects divergence between verified JWT tenant and host hint', async () => {
    await expect(
      executeInRequest({ ...verifiedInput(), hostTenant: 'another-farm' }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('rejects divergence between signed organization and tenant registry', async () => {
    await expect(
      executeInRequest({
        ...verifiedInput(),
        verifiedOrganizationId: 'organization-attacker',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(registry.findMembership.mock.calls).toHaveLength(0);
  });

  it('rejects a subject without active organization membership', async () => {
    registry.findMembership.mockResolvedValue(null);

    await expect(executeInRequest()).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('rejects a farm outside the verified membership', async () => {
    await expect(
      executeInRequest({ ...verifiedInput(), requestedFarmId: 99 }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });
});
