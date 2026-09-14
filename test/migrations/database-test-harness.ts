import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const disposableDatabasePattern = /^gado_wave00_test_[0-9a-f]{12}$/;
const tenantSchemaPattern = /^tenant_[0-9a-f]{32}$/;

export const ADMIN_MIGRATION_VERSION = '202609140001_initial_admin';
export const TENANT_INITIAL_VERSION = '202609140001_initial_tenant';
export const TENANT_CURRENT_VERSION =
  '202609140002_animal_ear_tag_lookup_index';

export const requireTestDatabaseUrl = (): string => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required');
  }
  return databaseUrl;
};

export const assertDisposableDatabase = async (pool: Pool): Promise<void> => {
  const result = await pool.query<{ databaseName: string }>(
    'SELECT current_database() AS "databaseName"',
  );
  const databaseName = result.rows[0]?.databaseName ?? '';
  if (!disposableDatabasePattern.test(databaseName)) {
    throw new Error('refusingNonDisposableDatabase');
  }
};

export const resetAdminDatabase = async (pool: Pool): Promise<void> => {
  await assertDisposableDatabase(pool);
  await pool.query('DROP SCHEMA IF EXISTS "gado_admin" CASCADE');
  await pool.query('DROP TABLE IF EXISTS "public"."_prisma_migrations"');
};

export const deployAdminMigrations = (databaseUrl: string): void => {
  const prismaCli = resolve(process.cwd(), 'node_modules/prisma/build/index.js');
  const result = spawnSync(
    process.execPath,
    [prismaCli, 'migrate', 'deploy', '--config', 'prisma.config.ts'],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
      windowsHide: true,
    },
  );
  if (result.status !== 0) {
    throw new Error('adminMigrationDeployFailed');
  }
};

export const disposableTenantSchema = (): string =>
  `tenant_${randomBytes(16).toString('hex')}`;

export const dropTenantSchema = async (
  pool: Pool,
  schemaName: string,
): Promise<void> => {
  await assertDisposableDatabase(pool);
  if (!tenantSchemaPattern.test(schemaName)) {
    throw new Error('refusingInvalidTenantSchema');
  }
  await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
};
