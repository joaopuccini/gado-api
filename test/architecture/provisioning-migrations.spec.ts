import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('tenant provisioning migration boundary', () => {
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
});
