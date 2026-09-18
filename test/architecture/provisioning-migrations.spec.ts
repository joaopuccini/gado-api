import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('tenant provisioning migration boundary', () => {
  const tenantMigrationsPath = resolve(
    process.cwd(),
    'prisma/tenant/migrations',
  );
  const provisioningServicePath = resolve(
    process.cwd(),
    'src/auth/services/social-provisioning.service.ts',
  );
  const source = readFileSync(provisioningServicePath, 'utf8');

  it('delegates schema creation to the versioned migration use case', () => {
    expect(source).toContain('MigrateTenantSchemaUseCase');
    expect(source).toContain('migrateTenantSchema.execute()');
  });

  it('does not copy public tables or execute schema DDL directly', () => {
    expect(source).not.toContain('$executeRawUnsafe');
    expect(source).not.toContain('$queryRawUnsafe');
    expect(source).not.toMatch(/CREATE\s+TABLE[\s\S]+\sLIKE\s/i);
    expect(source).not.toContain("templateSchema = 'public'");
  });

  it('rejects migration directories that the loader would silently ignore', () => {
    const invalidDirectories = readdirSync(tenantMigrationsPath, {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map(({ name }) => name)
      .filter((name) => !/^\d{12}_[a-z0-9_]+$/.test(name));

    expect(invalidDirectories).toEqual([]);
  });
});
