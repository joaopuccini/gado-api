import { ExecutionContextStore } from '../../../common/context';
import { MigrateTenantSchemaUseCase } from './migrate-tenant-schema.use-case';
import { ProvisionSchemaUseCase } from './provision-schema.use-case';

describe('ProvisionSchemaUseCase', () => {
  const schemaName = 'tenant_0123456789abcdef0123456789abcdef';
  let context: ExecutionContextStore;
  let migrateTenantSchema: jest.Mocked<
    Pick<MigrateTenantSchemaUseCase, 'execute'>
  >;
  let useCase: ProvisionSchemaUseCase;

  beforeEach(() => {
    context = new ExecutionContextStore();
    migrateTenantSchema = {
      execute: jest.fn().mockImplementation(() => {
        expect(context.requireTenantIdentity()).toMatchObject({
          contextType: 'job',
          tenantId: 'tenant-id',
          organizationId: 'organization-id',
          schemaName,
          globalUserId: 'global-user-id',
          permissions: ['tenant.migrate'],
        });
        return Promise.resolve({
          fromVersion: null,
          toVersion: '003_identity',
        });
      }),
    };
    useCase = new ProvisionSchemaUseCase(
      context,
      migrateTenantSchema as unknown as MigrateTenantSchemaUseCase,
      () => 'provision-request-id',
      () => 123,
    );
  });

  it('creates the verified job context and applies the tenant migration chain', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        schemaName,
        initiatedByGlobalUserId: 'global-user-id',
      }),
    ).resolves.toEqual({
      schemaName,
      fromVersion: null,
      toVersion: '003_identity',
    });
    expect(migrateTenantSchema.execute).toHaveBeenCalledTimes(1);
    expect(context.current()).toBeUndefined();
  });

  it('uses server-generated request metadata by default', async () => {
    const defaultUseCase = new ProvisionSchemaUseCase(
      context,
      migrateTenantSchema as unknown as MigrateTenantSchemaUseCase,
    );

    await expect(
      defaultUseCase.execute({
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        schemaName,
        initiatedByGlobalUserId: 'global-user-id',
      }),
    ).resolves.toMatchObject({ schemaName });
  });

  it('rejects a client-controlled or malformed schema before migration', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        schemaName: 'public',
        initiatedByGlobalUserId: 'global-user-id',
      }),
    ).rejects.toMatchObject({ code: 'invalidTenantSchemaName' });
    expect(migrateTenantSchema.execute).not.toHaveBeenCalled();
  });

  it.each(['tenantId', 'organizationId', 'initiatedByGlobalUserId'] as const)(
    'rejects an empty %s before migration',
    async (field) => {
      await expect(
        useCase.execute({
          tenantId: 'tenant-id',
          organizationId: 'organization-id',
          schemaName,
          initiatedByGlobalUserId: 'global-user-id',
          [field]: ' ',
        }),
      ).rejects.toMatchObject({ code: 'invalidProvisioningRun' });
      expect(migrateTenantSchema.execute).not.toHaveBeenCalled();
    },
  );
});
