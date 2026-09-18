import type { OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { DomainError } from '../../common/errors/domain-error';
import type { TenantSchemaName } from '../../tenant/domain/tenant-schema-name';
import type { TenantSchemaLifecycleRepository } from '../application/ports/tenant-schema-lifecycle.repository';

export class PostgresTenantSchemaLifecycleRepository
  implements TenantSchemaLifecycleRepository, OnModuleDestroy
{
  private pool: Pool | undefined;

  constructor(private readonly connectionString: () => string) {}

  async ensureExists(schemaName: TenantSchemaName): Promise<void> {
    try {
      await this.databasePool().query(
        `CREATE SCHEMA IF NOT EXISTS "${schemaName.value}"`,
      );
    } catch (error: unknown) {
      throw new DomainError(
        'tenantSchemaCreationFailed',
        'Falha ao criar schema tenant',
        undefined,
        error,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) await this.pool.end();
  }

  private databasePool(): Pool {
    this.pool ??= new Pool({
      connectionString: this.connectionString(),
      max: 2,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    return this.pool;
  }
}
