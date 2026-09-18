import type { TenantSchemaName } from '../../../tenant/domain/tenant-schema-name';

export const TENANT_SCHEMA_LIFECYCLE_REPOSITORY = Symbol(
  'TENANT_SCHEMA_LIFECYCLE_REPOSITORY',
);

export interface TenantSchemaLifecycleRepository {
  ensureExists(schemaName: TenantSchemaName): Promise<void>;
}
