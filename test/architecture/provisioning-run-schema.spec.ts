import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('provisioning run persistence architecture', () => {
  const schema = readFileSync(
    resolve(process.cwd(), 'prisma/admin/schema.prisma'),
    'utf8',
  );
  const migrationPath = resolve(
    process.cwd(),
    'prisma/admin/migrations/20260917153000_add_provisioning_runs/migration.sql',
  );

  it('persists runs and individually retryable steps in the admin schema', () => {
    expect(schema).toContain('model ProvisioningRun {');
    expect(schema).toContain('idempotencyKey');
    expect(schema).toMatch(/state\s+ProvisioningState/);
    expect(schema).toMatch(/steps\s+ProvisioningStep\[\]/);
    expect(schema).toContain('model ProvisioningStep {');
    expect(schema).toContain('@@unique([runId, state, attempt])');
  });

  it('adds the persistence model through a new forward-only migration', () => {
    expect(existsSync(migrationPath)).toBe(true);

    if (!existsSync(migrationPath)) return;
    const migration = readFileSync(migrationPath, 'utf8');

    expect(migration).toContain(
      'CREATE TABLE "gado_admin"."provisioning_runs"',
    );
    expect(migration).toContain(
      'CREATE TABLE "gado_admin"."provisioning_steps"',
    );
    expect(migration).not.toMatch(/^\s*(?:DROP|TRUNCATE|DELETE)\b/im);
  });
});
