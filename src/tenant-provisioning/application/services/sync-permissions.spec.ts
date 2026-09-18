import { ExecutionContextStore } from '../../../common/context';
import {
  PERMISSIONS_CATALOG,
  type PermissionEntry,
} from '../../../common/rbac/permissions-catalog';
import type {
  QueryObservablePrismaClient,
  TenantPrismaClientFactoryPort,
} from '../../../tenant/application/ports/tenant-prisma-client-factory.port';
import type { PermissionCatalogRepository } from '../ports/permission-catalog.repository';
import { PrismaPermissionCatalogRepository } from '../../infrastructure/persistence/prisma/prisma-permission-catalog.repository';
import { SyncPermissionsService } from './sync-permissions.service';

describe('SyncPermissionsService', () => {
  it('sends the complete catalog to the repository without changing stable fields', async () => {
    const repository: jest.Mocked<PermissionCatalogRepository> = {
      sync: jest.fn().mockResolvedValue(undefined),
    };
    const service = new SyncPermissionsService(repository);

    await service.execute();

    expect(repository.sync.mock.calls).toHaveLength(1);
    expect(repository.sync.mock.calls[0]).toEqual([PERMISSIONS_CATALOG]);
    expect(repository.sync.mock.calls[0][0]).toEqual(
      PERMISSIONS_CATALOG.map(({ id, code, module, action, ...copy }) => ({
        id,
        code,
        module,
        action,
        ...copy,
      })),
    );
  });
});

describe('PrismaPermissionCatalogRepository', () => {
  const schemaName = 'tenant_0123456789abcdef0123456789abcdef';
  const upsert = jest.fn();
  const deleteMany = jest.fn();
  const transaction = jest.fn(
    (
      operationsOrCallback:
        | readonly Promise<unknown>[]
        | ((client: {
            permissao: { upsert: typeof upsert; deleteMany: typeof deleteMany };
          }) => Promise<unknown>),
    ) => {
      if (typeof operationsOrCallback === 'function') {
        return operationsOrCallback(tenantClient);
      }
      return Promise.all(operationsOrCallback);
    },
  );
  const tenantClient = {
    permissao: { upsert, deleteMany },
    $transaction: transaction,
  } as unknown as QueryObservablePrismaClient;
  const clientFactory: jest.Mocked<TenantPrismaClientFactoryPort> = {
    create: jest.fn().mockReturnValue(tenantClient),
    dispose: jest.fn().mockResolvedValue(undefined),
  };
  const context = new ExecutionContextStore();
  const repository = new PrismaPermissionCatalogRepository(
    context,
    clientFactory,
  );
  const managedEntry: PermissionEntry = PERMISSIONS_CATALOG[0];

  const runInJobContext = <T>(callback: () => T): T =>
    context.run(
      {
        requestId: 'request-id',
        traceId: 'trace-id',
        contextType: 'job',
        startedAt: 1,
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        schemaName,
        globalUserId: 'global-user-id',
        accessibleFarmIds: [],
        permissions: [],
      },
      callback,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    upsert.mockResolvedValue({ id: managedEntry.id });
  });

  it('upserts managed permissions by stable ID and repairs mutable fields', async () => {
    await runInJobContext(() => repository.sync([managedEntry]));

    expect(clientFactory.create.mock.calls[0]).toEqual([
      expect.objectContaining({ value: schemaName }),
    ]);
    expect(upsert).toHaveBeenCalledWith({
      where: { id: managedEntry.id },
      create: {
        id: managedEntry.id,
        codigo: managedEntry.code,
        nome: managedEntry.label,
        descricao: managedEntry.description,
        modulo: managedEntry.module,
        categoria: managedEntry.action,
        ativo: true,
      },
      update: {
        codigo: managedEntry.code,
        nome: managedEntry.label,
        descricao: managedEntry.description,
        modulo: managedEntry.module,
        categoria: managedEntry.action,
        ativo: true,
      },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('is idempotent and never deletes permissions outside the catalog', async () => {
    await runInJobContext(() => repository.sync(PERMISSIONS_CATALOG));
    await runInJobContext(() => repository.sync(PERMISSIONS_CATALOG));

    expect(upsert).toHaveBeenCalledTimes(PERMISSIONS_CATALOG.length * 2);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('fails closed when the database rejects a code owned by another ID', async () => {
    upsert.mockRejectedValueOnce(new Error('unique constraint on codigo'));

    await expect(
      runInJobContext(() => repository.sync([managedEntry])),
    ).rejects.toThrow('unique constraint on codigo');
  });

  it('rejects execution without a verified tenant job context', async () => {
    await expect(repository.sync([managedEntry])).rejects.toMatchObject({
      code: 'executionContextMissing',
    });
    expect(clientFactory.create.mock.calls).toHaveLength(0);
  });
});
