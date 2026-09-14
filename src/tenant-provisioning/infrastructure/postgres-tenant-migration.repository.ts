import type { OnModuleDestroy } from '@nestjs/common';
import { Pool, type PoolClient } from 'pg';
import { DomainError } from '../../common/errors/domain-error';
import type { StructuredLogger } from '../../common/logger/structured-logger.service';
import type { TenantSchemaName } from '../../tenant/domain/tenant-schema-name';
import type {
  TenantMigration,
  TenantMigrationRepository,
} from '../application/ports/tenant-migration.repository';

type MigrationLogger = Pick<StructuredLogger, 'info' | 'error'>;
type DatabaseConnection = Pool | string | (() => string);

const tenantMarker = '"__tenant__"';

export class PostgresTenantMigrationRepository
  implements TenantMigrationRepository, OnModuleDestroy
{
  private pool: Pool | undefined;
  private readonly connectionString: (() => string) | undefined;
  private readonly ownsPool: boolean;

  constructor(
    database: DatabaseConnection,
    private readonly logger?: MigrationLogger,
  ) {
    this.ownsPool = !(database instanceof Pool);
    if (database instanceof Pool) {
      this.pool = database;
      this.connectionString = undefined;
      return;
    }
    this.connectionString =
      typeof database === 'string' ? () => database : database;
  }

  async appliedVersions(
    schemaName: TenantSchemaName,
  ): Promise<Map<string, string>> {
    const trackingTable = `${schemaName.value}._gado_tenant_migrations`;
    const table = await this.databasePool().query<{
      relationName: string | null;
    }>('SELECT to_regclass($1) AS "relationName"', [trackingTable]);
    if (table.rows[0]?.relationName === null) return new Map();

    const result = await this.databasePool().query<{
      version: string;
      checksum: string;
    }>(`
      SELECT version, checksum
      FROM ${this.quotedSchema(schemaName)}."_gado_tenant_migrations"
      ORDER BY version
    `);
    return new Map(
      result.rows.map(({ version, checksum }) => [version, checksum]),
    );
  }

  async apply(
    schemaName: TenantSchemaName,
    migration: TenantMigration,
  ): Promise<void> {
    if (!migration.sql.includes(tenantMarker)) {
      throw new DomainError(
        'migrationChainInvalid',
        'Migration tenant sem marcador de schema reservado',
      );
    }

    const client = await this.databasePool().connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `tenantMigration:${schemaName.value}`,
      ]);

      const existingChecksum = await this.findAppliedChecksum(
        client,
        schemaName,
        migration.version,
      );
      if (existingChecksum !== null) {
        if (existingChecksum !== migration.checksum) {
          throw new DomainError(
            'migrationChecksumMismatch',
            'Checksum de migration tenant divergente',
          );
        }
        await client.query('COMMIT');
        return;
      }

      const migratedSql = migration.sql
        .split(tenantMarker)
        .join(this.quotedSchema(schemaName));
      await client.query(migratedSql);
      await this.ensureTrackingTable(client, schemaName);
      await client.query(
        `
          INSERT INTO ${this.quotedSchema(schemaName)}."_gado_tenant_migrations"
            (version, checksum, applied_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
        `,
        [migration.version, migration.checksum],
      );
      await client.query('COMMIT');
      this.logger?.info('tenantMigrationApplied', {
        module: 'tenantProvisioning',
        operation: 'applyTenantMigration',
        migrationVersion: migration.version,
      });
    } catch (error: unknown) {
      await this.rollback(client);
      this.logger?.error('tenantMigrationFailed', {
        module: 'tenantProvisioning',
        operation: 'applyTenantMigration',
        migrationVersion: migration.version,
        errorCode:
          error instanceof DomainError ? error.code : 'tenantMigrationFailed',
      });
      if (error instanceof DomainError) throw error;
      throw new DomainError(
        'tenantMigrationFailed',
        'Falha ao aplicar migration tenant',
        undefined,
        error,
      );
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.ownsPool && this.pool) await this.pool.end();
  }

  private databasePool(): Pool {
    if (this.pool) return this.pool;
    if (!this.connectionString) {
      throw new DomainError(
        'tenantMigrationFailed',
        'Configuração da base de dados tenant indisponível',
      );
    }
    this.pool = new Pool({
      connectionString: this.connectionString(),
      max: 2,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    return this.pool;
  }

  private quotedSchema(schemaName: TenantSchemaName): string {
    return `"${schemaName.value}"`;
  }

  private async findAppliedChecksum(
    client: PoolClient,
    schemaName: TenantSchemaName,
    version: string,
  ): Promise<string | null> {
    const trackingTable = `${schemaName.value}._gado_tenant_migrations`;
    const table = await client.query<{ relationName: string | null }>(
      'SELECT to_regclass($1) AS "relationName"',
      [trackingTable],
    );
    if (table.rows[0]?.relationName === null) return null;

    const result = await client.query<{ checksum: string }>(
      `
        SELECT checksum
        FROM ${this.quotedSchema(schemaName)}."_gado_tenant_migrations"
        WHERE version = $1
      `,
      [version],
    );
    return result.rows[0]?.checksum ?? null;
  }

  private async ensureTrackingTable(
    client: PoolClient,
    schemaName: TenantSchemaName,
  ): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${this.quotedSchema(schemaName)}."_gado_tenant_migrations" (
        "version" varchar(200) PRIMARY KEY,
        "checksum" char(64) NOT NULL,
        "applied_at" timestamptz(6) NOT NULL
      )
    `);
  }

  private async rollback(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The original migration error remains authoritative.
    }
  }
}
