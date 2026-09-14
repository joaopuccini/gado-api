import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DomainError } from '../../common/errors/domain-error';
import type {
  TenantMigration,
  TenantMigrationSource,
} from '../application/ports/tenant-migration.repository';

const migrationDirectoryPattern = /^\d{12}_[a-z0-9_]+$/;
const tenantMarker = '"__tenant__"';

export class TenantMigrationLoader implements TenantMigrationSource {
  constructor(
    private readonly migrationsPath = resolve(
      process.cwd(),
      'prisma/tenant/migrations',
    ),
  ) {}

  async load(): Promise<readonly TenantMigration[]> {
    let entries;
    try {
      entries = await readdir(this.migrationsPath, { withFileTypes: true });
    } catch (error: unknown) {
      throw new DomainError(
        'migrationChainInvalid',
        'Diretório de migrations tenant indisponível',
        undefined,
        error,
      );
    }

    const versions = entries
      .filter(
        (entry) =>
          entry.isDirectory() && migrationDirectoryPattern.test(entry.name),
      )
      .map(({ name }) => name)
      .sort((left, right) => left.localeCompare(right));

    return Promise.all(
      versions.map(async (version): Promise<TenantMigration> => {
        const sql = await readFile(
          join(this.migrationsPath, version, 'migration.sql'),
          'utf8',
        );
        if (!sql.includes(tenantMarker)) {
          throw new DomainError(
            'migrationChainInvalid',
            'Migration tenant sem marcador de schema reservado',
          );
        }
        return Object.freeze({
          version,
          checksum: createHash('sha256').update(sql).digest('hex'),
          sql,
        });
      }),
    );
  }
}
