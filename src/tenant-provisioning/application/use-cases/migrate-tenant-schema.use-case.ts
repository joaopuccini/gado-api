import { ExecutionContextStore } from '../../../common/context';
import { DomainError } from '../../../common/errors/domain-error';
import { TenantSchemaName } from '../../../tenant/domain/tenant-schema-name';
import type {
  TenantMigration,
  TenantMigrationRepository,
  TenantMigrationSource,
} from '../ports/tenant-migration.repository';

export interface TenantMigrationResult {
  readonly fromVersion: string | null;
  readonly toVersion: string;
}

const checksumPattern = /^[0-9a-f]{64}$/;

export class MigrateTenantSchemaUseCase {
  constructor(
    private readonly context: ExecutionContextStore,
    private readonly repository: TenantMigrationRepository,
    private readonly source: TenantMigrationSource,
  ) {}

  async execute(): Promise<TenantMigrationResult> {
    const { schemaName } = this.context.requireTenantIdentity();
    const schema = TenantSchemaName.parse(schemaName);
    const migrations = await this.source.load();
    this.assertValidChain(migrations);

    const applied = await this.repository.appliedVersions(schema);
    this.assertKnownAppliedVersions(migrations, applied);

    const fromVersion = this.lastAppliedVersion(migrations, applied);
    for (const migration of migrations) {
      const appliedChecksum = applied.get(migration.version);
      if (appliedChecksum === undefined) {
        await this.repository.apply(schema, migration);
        continue;
      }
      if (appliedChecksum !== migration.checksum) {
        throw new DomainError(
          'migrationChecksumMismatch',
          'Checksum de migration tenant divergente',
        );
      }
    }

    return {
      fromVersion,
      toVersion: migrations[migrations.length - 1].version,
    };
  }

  private assertValidChain(migrations: readonly TenantMigration[]): void {
    if (migrations.length === 0) {
      throw new DomainError(
        'migrationChainInvalid',
        'Cadeia de migrations tenant vazia',
      );
    }

    const versions = migrations.map(({ version }) => version);
    const sortedVersions = [...versions].sort((left, right) =>
      left.localeCompare(right),
    );
    const checksumsAreValid = migrations.every(({ checksum }) =>
      checksumPattern.test(checksum),
    );
    if (
      new Set(versions).size !== versions.length ||
      versions.some((version, index) => version !== sortedVersions[index]) ||
      !checksumsAreValid
    ) {
      throw new DomainError(
        'migrationChainInvalid',
        'Cadeia de migrations tenant inválida',
      );
    }
  }

  private assertKnownAppliedVersions(
    migrations: readonly TenantMigration[],
    applied: ReadonlyMap<string, string>,
  ): void {
    const knownVersions = new Set(migrations.map(({ version }) => version));
    if ([...applied.keys()].some((version) => !knownVersions.has(version))) {
      throw new DomainError(
        'migrationChainInvalid',
        'Schema tenant contém migration desconhecida',
      );
    }
  }

  private lastAppliedVersion(
    migrations: readonly TenantMigration[],
    applied: ReadonlyMap<string, string>,
  ): string | null {
    return (
      [...migrations].reverse().find(({ version }) => applied.has(version))
        ?.version ?? null
    );
  }
}
