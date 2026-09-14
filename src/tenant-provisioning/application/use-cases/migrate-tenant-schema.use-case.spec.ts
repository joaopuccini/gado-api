import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../common/context';
import type {
  TenantMigration,
  TenantMigrationRepository,
  TenantMigrationSource,
} from '../ports/tenant-migration.repository';
import { MigrateTenantSchemaUseCase } from './migrate-tenant-schema.use-case';

const contextFor = (schemaName: string): ExecutionContextData => ({
  requestId: 'migration-request',
  traceId: 'migration-trace',
  contextType: 'job',
  startedAt: Date.now(),
  tenantId: 'tenant-id',
  organizationId: 'organization-id',
  schemaName,
  globalUserId: 'migration-worker',
  accessibleFarmIds: [],
  permissions: ['tenant.migrate'],
});

const migrations: readonly TenantMigration[] = [
  { version: '001_initial', checksum: 'a'.repeat(64), sql: 'SELECT 1' },
  { version: '002_index', checksum: 'b'.repeat(64), sql: 'SELECT 2' },
];

describe('MigrateTenantSchemaUseCase', () => {
  const schemaName = 'tenant_0123456789abcdef0123456789abcdef';
  let context: ExecutionContextStore;
  let repository: jest.Mocked<TenantMigrationRepository>;
  let source: jest.Mocked<TenantMigrationSource>;
  let useCase: MigrateTenantSchemaUseCase;

  beforeEach(() => {
    context = new ExecutionContextStore();
    repository = {
      appliedVersions: jest.fn().mockResolvedValue(new Map()),
      apply: jest.fn().mockResolvedValue(undefined),
    };
    source = { load: jest.fn().mockResolvedValue(migrations) };
    useCase = new MigrateTenantSchemaUseCase(context, repository, source);
  });

  it('fails closed outside a verified tenant or provisioning job context', async () => {
    await expect(useCase.execute()).rejects.toMatchObject({
      code: 'executionContextMissing',
    });
    expect(repository.appliedVersions.mock.calls).toHaveLength(0);
  });

  it('applies pending migrations in order and reports the version range', async () => {
    repository.appliedVersions.mockResolvedValue(
      new Map([['001_initial', 'a'.repeat(64)]]),
    );

    await expect(
      context.run(contextFor(schemaName), () => useCase.execute()),
    ).resolves.toEqual({ fromVersion: '001_initial', toVersion: '002_index' });

    expect(repository.apply.mock.calls).toEqual([
      [expect.objectContaining({ value: schemaName }), migrations[1]],
    ]);
  });

  it('rejects a changed checksum before applying anything', async () => {
    repository.appliedVersions.mockResolvedValue(
      new Map([['001_initial', 'changed-checksum']]),
    );

    await expect(
      context.run(contextFor(schemaName), () => useCase.execute()),
    ).rejects.toMatchObject({ code: 'migrationChecksumMismatch' });
    expect(repository.apply.mock.calls).toHaveLength(0);
  });

  it.each([
    ['empty', []],
    ['duplicate', [migrations[0], migrations[0]]],
    ['unsorted', [migrations[1], migrations[0]]],
    [
      'invalid checksum',
      [{ ...migrations[0], checksum: 'not-a-sha256-checksum' }],
    ],
  ] as const)('rejects an %s migration chain', async (_case, chain) => {
    source.load.mockResolvedValue(chain);

    await expect(
      context.run(contextFor(schemaName), () => useCase.execute()),
    ).rejects.toMatchObject({ code: 'migrationChainInvalid' });
    expect(repository.appliedVersions.mock.calls).toHaveLength(0);
  });

  it('rejects versions applied to the tenant but absent from source', async () => {
    repository.appliedVersions.mockResolvedValue(
      new Map([['000_unknown', 'c'.repeat(64)]]),
    );

    await expect(
      context.run(contextFor(schemaName), () => useCase.execute()),
    ).rejects.toMatchObject({ code: 'migrationChainInvalid' });
    expect(repository.apply.mock.calls).toHaveLength(0);
  });

  it('returns the current version without reapplying a complete chain', async () => {
    repository.appliedVersions.mockResolvedValue(
      new Map(migrations.map(({ version, checksum }) => [version, checksum])),
    );

    await expect(
      context.run(contextFor(schemaName), () => useCase.execute()),
    ).resolves.toEqual({
      fromVersion: '002_index',
      toVersion: '002_index',
    });
    expect(repository.apply.mock.calls).toHaveLength(0);
  });
});
