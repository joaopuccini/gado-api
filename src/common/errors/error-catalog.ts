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
  | 'internalServerError';

export interface ErrorDetail {
  field?: string;
  reason: string;
}
