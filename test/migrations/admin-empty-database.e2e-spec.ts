import { Pool } from 'pg';
import {
  ADMIN_MIGRATION_VERSION,
  assertDisposableDatabase,
  deployAdminMigrations,
  requireTestDatabaseUrl,
  resetAdminDatabase,
} from './database-test-harness';

jest.setTimeout(60_000);

describe('administrative migrations on an empty database', () => {
  const databaseUrl = requireTestDatabaseUrl();
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });

  beforeAll(async () => {
    await assertDisposableDatabase(pool);
    await resetAdminDatabase(pool);
  });

  afterAll(async () => {
    await resetAdminDatabase(pool);
    await pool.end();
  });

  it('creates gado_admin with its tables, constraints and recorded version', async () => {
    deployAdminMigrations(databaseUrl);

    const tables = await pool.query<{ tableName: string }>(`
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = 'gado_admin'
      ORDER BY table_name
    `);
    expect(tables.rows.map(({ tableName }) => tableName)).toEqual(
      expect.arrayContaining([
        'acesso_organizacoes',
        'admin_users',
        'assinaturas',
        'convites',
        'organizacoes',
        'pagamentos',
        'planos',
        'tenant_registry',
        'usuarios_globais',
      ]),
    );

    const constraints = await pool.query<{ foreignKeys: number }>(`
      SELECT count(*)::int AS "foreignKeys"
      FROM pg_constraint constraint_record
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = constraint_record.connamespace
      WHERE namespace_record.nspname = 'gado_admin'
        AND constraint_record.contype = 'f'
    `);
    expect(constraints.rows[0]?.foreignKeys).toBeGreaterThanOrEqual(8);

    const versions = await pool.query<{ migrationName: string }>(`
      SELECT migration_name AS "migrationName"
      FROM public._prisma_migrations
      WHERE finished_at IS NOT NULL
    `);
    expect(versions.rows.map(({ migrationName }) => migrationName)).toContain(
      ADMIN_MIGRATION_VERSION,
    );
  });
});
