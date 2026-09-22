import { Pool } from 'pg';
import { ExecutionContextStore } from '../../src/common/context';
import { TenantSchemaName } from '../../src/tenant/domain/tenant-schema-name';
import { MigrateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { PostgresTenantMigrationRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository';
import { TenantMigrationLoader } from '../../src/tenant-provisioning/infrastructure/tenant-migration.loader';
import {
  TENANT_CURRENT_VERSION,
  assertDisposableDatabase,
  disposableTenantSchema,
  dropTenantSchema,
  requireTestDatabaseUrl,
} from './database-test-harness';

jest.setTimeout(60_000);

describe('tenant migrations on an empty schema', () => {
  const databaseUrl = requireTestDatabaseUrl();
  const schemaName = disposableTenantSchema();
  const schema = TenantSchemaName.parse(schemaName);
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const context = new ExecutionContextStore();
  const repository = new PostgresTenantMigrationRepository(pool);
  const loader = new TenantMigrationLoader();
  const useCase = new MigrateTenantSchemaUseCase(context, repository, loader);

  beforeAll(async () => {
    await assertDisposableDatabase(pool);
  });

  afterAll(async () => {
    await dropTenantSchema(pool, schemaName);
    await pool.end();
  });

  it('creates normalized tables, constraints, seeds and checksummed versions', async () => {
    const result = await context.run(
      {
        requestId: 'tenant-migration-request',
        traceId: 'tenant-migration-trace',
        contextType: 'job',
        startedAt: Date.now(),
        tenantId: 'migration-tenant',
        organizationId: 'migration-organization',
        schemaName,
        globalUserId: 'migration-worker',
        accessibleFarmIds: [],
        permissions: ['tenant.migrate'],
      },
      () => useCase.execute(),
    );

    expect(result).toEqual({
      fromVersion: null,
      toVersion: TENANT_CURRENT_VERSION,
    });

    const tables = await pool.query<{ tableName: string }>(
      `
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name
    `,
      [schemaName],
    );
    expect(tables.rows.map(({ tableName }) => tableName)).toEqual(
      expect.arrayContaining([
        '_gado_tenant_migrations',
        'animais',
        'fazendas',
        'perfis',
        'permissoes',
        'usuarios',
      ]),
    );

    const foreignKeys = await pool.query<{ total: number }>(
      `
      SELECT count(*)::int AS total
      FROM pg_constraint constraint_record
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = constraint_record.connamespace
      WHERE namespace_record.nspname = $1
        AND constraint_record.contype = 'f'
    `,
      [schemaName],
    );
    expect(foreignKeys.rows[0]?.total).toBeGreaterThan(20);

    const seedCounts = await pool.query<{
      permissions: number;
      profiles: number;
    }>(`
      SELECT
        (SELECT count(*)::int FROM "${schemaName}"."permissoes") AS permissions,
        (SELECT count(*)::int FROM "${schemaName}"."perfis") AS profiles
    `);
    expect(seedCounts.rows[0]?.permissions).toBeGreaterThan(0);
    expect(seedCounts.rows[0]?.profiles).toBeGreaterThan(0);

    const expectedMigrations = await loader.load();
    const applied = await repository.appliedVersions(schema);
    expect([...applied.entries()]).toEqual(
      expectedMigrations.map(({ version, checksum }) => [version, checksum]),
    );

    const hierarchyObjects = await pool.query<{ name: string }>(
      `
      SELECT indexname AS name
      FROM pg_indexes
      WHERE schemaname = $1
        AND indexname IN (
          'fazendas_parent_id_ativo_idx',
          'usuario_fazenda_usuario_id_ativo_fazenda_id_idx'
        )
      UNION ALL
      SELECT constraint_name AS name
      FROM information_schema.table_constraints
      WHERE constraint_schema = $1
        AND constraint_name = 'fazendas_parent_not_self'
      ORDER BY name
      `,
      [schemaName],
    );
    expect(hierarchyObjects.rows.map(({ name }) => name)).toEqual([
      'fazendas_parent_id_ativo_idx',
      'fazendas_parent_not_self',
      'usuario_fazenda_usuario_id_ativo_fazenda_id_idx',
    ]);
  });
});
