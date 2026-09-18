export type ErrorCode =
  | 'executionContextMissing'
  | 'validationFailed'
  | 'unauthenticated'
  | 'forbidden'
  | 'resourceNotFound'
  | 'conflict'
  | 'rateLimitExceeded'
  | 'tenantContextMissing'
  | 'tenantUnavailable'
  | 'animalNotFound'
  | 'internalServerError'
  | 'invalidTenantSchemaName'
  | 'migrationChecksumMismatch'
  | 'migrationChainInvalid'
  | 'tenantMigrationFailed'
  | 'tenantSchemaCreationFailed'
  | 'tenantSmokeCheckFailed'
  | 'invalidProvisioningRun'
  | 'invalidProvisioningTransition';

export interface ErrorDetail {
  field?: string;
  reason: string;
}
