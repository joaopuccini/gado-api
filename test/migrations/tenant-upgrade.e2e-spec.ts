import { Pool } from 'pg';
import { ExecutionContextStore } from '../../src/common/context';
import { TenantSchemaName } from '../../src/tenant/infrastructure/schema-name';
import { MigrateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { PostgresTenantMigrationRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository';
import { TenantMigrationLoader } from '../../src/tenant-provisioning/infrastructure/tenant-migration.loader';
import {
  TENANT_CURRENT_VERSION,
  TENANT_INITIAL_VERSION,
  assertDisposableDatabase,
  disposableTenantSchema,
  dropTenantSchema,
  requireTestDatabaseUrl,
} from './database-test-harness';

jest.setTimeout(60_000);

describe('tenant schema upgrade and retry', () => {
  const databaseUrl = requireTestDatabaseUrl();
  const schemaName = disposableTenantSchema();
  const schema = TenantSchemaName.parse(schemaName);
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const context = new ExecutionContextStore();
  const repository = new PostgresTenantMigrationRepository(pool);
  const loader = new TenantMigrationLoader();
  const useCase = new MigrateTenantSchemaUseCase(context, repository, loader);

  const runMigration = () =>
    context.run(
      {
        requestId: 'tenant-upgrade-request',
        traceId: 'tenant-upgrade-trace',
        contextType: 'job',
        startedAt: Date.now(),
        tenantId: 'upgrade-tenant',
        organizationId: 'upgrade-organization',
        schemaName,
        globalUserId: 'migration-worker',
        localUserId: 1,
        farmId: 1,
        accessibleFarmIds: [1],
        permissions: ['tenant.migrate'],
      },
      () => useCase.execute(),
    );

  beforeAll(async () => {
    await assertDisposableDatabase(pool);
  });

  afterAll(async () => {
    await dropTenantSchema(pool, schemaName);
    await pool.end();
  });

  it('applies only pending versions and does not repeat them on retry', async () => {
    const migrations = await loader.load();
    expect(migrations.map(({ version }) => version)).toEqual([
      TENANT_INITIAL_VERSION,
      TENANT_CURRENT_VERSION,
    ]);
    await repository.apply(schema, migrations[0]);

    await expect(runMigration()).resolves.toEqual({
      fromVersion: TENANT_INITIAL_VERSION,
      toVersion: TENANT_CURRENT_VERSION,
    });
    const firstApplication = await pool.query<{
      version: string;
      appliedAt: Date;
    }>(`
      SELECT version, applied_at AS "appliedAt"
      FROM "${schemaName}"."_gado_tenant_migrations"
      ORDER BY version
    `);

    await expect(runMigration()).resolves.toEqual({
      fromVersion: TENANT_CURRENT_VERSION,
      toVersion: TENANT_CURRENT_VERSION,
    });
    const retry = await pool.query<{ version: string; appliedAt: Date }>(`
      SELECT version, applied_at AS "appliedAt"
      FROM "${schemaName}"."_gado_tenant_migrations"
      ORDER BY version
    `);

    expect(retry.rows).toEqual(firstApplication.rows);
    expect(retry.rows).toHaveLength(2);
  });
});
