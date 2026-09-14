import type { PrismaClient } from '@prisma/client';
import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../common/context';
import type { TenantPrismaClientFactoryPort } from './application/ports/tenant-prisma-client-factory.port';
import { TenantSchemaName } from './domain/tenant-schema-name';
import { TenantPrismaService } from './tenant-prisma.service';

const contextFor = (schemaName: string): ExecutionContextData => ({
  requestId: `request-${schemaName}`,
  traceId: `trace-${schemaName}`,
  contextType: 'tenant',
  startedAt: Date.now(),
  tenantId: `id-${schemaName}`,
  organizationId: `org-${schemaName}`,
  schemaName,
  globalUserId: 'global-user',
  localUserId: 1,
  farmId: 10,
  accessibleFarmIds: [10],
  permissions: ['animals.read'],
});

describe('TenantPrismaService', () => {
  const schemaA = 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const schemaB = 'tenant_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const clientA = { tenant: 'A' } as unknown as PrismaClient;
  const clientB = { tenant: 'B' } as unknown as PrismaClient;
  let store: ExecutionContextStore;
  let factory: jest.Mocked<TenantPrismaClientFactoryPort>;
  let service: TenantPrismaService;

  beforeEach(() => {
    store = new ExecutionContextStore();
    factory = {
      create: jest.fn((schema: TenantSchemaName) =>
        schema.value === schemaA ? clientA : clientB,
      ),
      dispose: jest.fn().mockResolvedValue(undefined),
    };
    service = new TenantPrismaService(store, factory);
  });

  it('refuses database access outside a verified tenant context', () => {
    let thrown: unknown;

    try {
      service.getClient();
    } catch (error: unknown) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: 'executionContextMissing' });
    expect(factory.create.mock.calls).toHaveLength(0);
  });

  it('selects the client exclusively from current AsyncLocalStorage context', () => {
    store.run(contextFor(schemaA), () => {
      expect(service.getClient()).toBe(clientA);
    });
    store.run(contextFor(schemaB), () => {
      expect(service.getClient()).toBe(clientB);
    });

    expect(factory.create.mock.calls.map(([schema]) => schema.value)).toEqual([
      schemaA,
      schemaB,
    ]);
  });
});
