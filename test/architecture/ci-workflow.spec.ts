import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('backend continuous integration workflow', () => {
  const workflowPath = resolve(process.cwd(), '.github/workflows/ci.yml');
  const coverageConfigPath = resolve(
    process.cwd(),
    'test/jest-foundation-coverage.json',
  );

  it('runs every foundation gate in dependency order', () => {
    expect(existsSync(workflowPath)).toBe(true);
    const workflow = readFileSync(workflowPath, 'utf8');
    const orderedCommands = [
      'npm ci',
      'npm run prisma:generate',
      'npm run lint:check',
      'npm run build',
      'npm run test:unit',
      'npm run test:architecture',
      'npm run test:contract',
      'npm run test:integration',
      'npm run test:migrations',
      'npm run test:isolation',
      'npm run test:cov',
      'npm run test:no-skipped',
    ];

    const positions = orderedCommands.map((command) =>
      workflow.indexOf(command),
    );
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual(
      [...positions].sort((left, right) => left - right),
    );
    expect(workflow).not.toContain('prisma db push');
    expect(workflow).not.toContain('migrate reset');
  });

  it('uses a disposable PostgreSQL database and generates both Prisma clients', () => {
    expect(existsSync(workflowPath)).toBe(true);
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('postgres:');
    expect(workflow).toContain('gado_wave00_test_000000000001');
    expect(workflow).toContain('prisma/admin/schema.prisma');
    expect(workflow).toContain('prisma/tenant/schema.prisma');
    expect(workflow).toContain('TEST_DATABASE_URL');
  });

  it('does not deploy admin migrations twice while collecting source coverage', () => {
    expect(existsSync(coverageConfigPath)).toBe(true);
    const coverageConfig = JSON.parse(
      readFileSync(coverageConfigPath, 'utf8'),
    ) as { testPathIgnorePatterns?: string[] };

    expect(coverageConfig.testPathIgnorePatterns).toContain(
      'admin-empty-database.e2e-spec.ts',
    );
    expect(coverageConfig.testPathIgnorePatterns).not.toContain(
      'test[\\\\/]migrations',
    );
  });
});
