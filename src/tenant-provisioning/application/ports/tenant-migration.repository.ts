import type { TenantSchemaName } from '../../../tenant/domain/tenant-schema-name';

export interface TenantMigration {
  readonly version: string;
  readonly checksum: string;
  readonly sql: string;
}

export interface TenantMigrationRepository {
  appliedVersions(schemaName: TenantSchemaName): Promise<Map<string, string>>;
  apply(
    schemaName: TenantSchemaName,
    migration: TenantMigration,
  ): Promise<void>;
}

export interface TenantMigrationSource {
  load(): Promise<readonly TenantMigration[]>;
}

export const TENANT_MIGRATION_REPOSITORY = Symbol(
  'TENANT_MIGRATION_REPOSITORY',
);
export const TENANT_MIGRATION_SOURCE = Symbol('TENANT_MIGRATION_SOURCE');
