import { HttpStatus } from '@nestjs/common';
import { DomainError } from './domain-error';
import type { ErrorCode, ErrorDetail } from './error-catalog';

export interface HttpErrorDescriptor {
  code: ErrorCode;
  statusCode: number;
  message: string;
  details?: readonly ErrorDetail[];
}

const statusByCode: Readonly<Record<ErrorCode, number>> = {
  executionContextMissing: HttpStatus.INTERNAL_SERVER_ERROR,
  validationFailed: HttpStatus.BAD_REQUEST,
  unauthenticated: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  resourceNotFound: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  rateLimitExceeded: HttpStatus.TOO_MANY_REQUESTS,
  tenantContextMissing: HttpStatus.UNAUTHORIZED,
  tenantUnavailable: HttpStatus.SERVICE_UNAVAILABLE,
  farmNotFound: HttpStatus.NOT_FOUND,
  farmAccessDenied: HttpStatus.FORBIDDEN,
  farmInactive: HttpStatus.CONFLICT,
  farmSelectedCannotDeactivate: HttpStatus.CONFLICT,
  invalidFarmHierarchy: HttpStatus.UNPROCESSABLE_ENTITY,
  invitationAlreadyPending: HttpStatus.CONFLICT,
  invitationUnavailable: HttpStatus.NOT_FOUND,
  invitationExpired: HttpStatus.GONE,
  animalNotFound: HttpStatus.NOT_FOUND,
  internalServerError: HttpStatus.INTERNAL_SERVER_ERROR,
  invalidTenantSchemaName: HttpStatus.INTERNAL_SERVER_ERROR,
  migrationChecksumMismatch: HttpStatus.INTERNAL_SERVER_ERROR,
  migrationChainInvalid: HttpStatus.INTERNAL_SERVER_ERROR,
  tenantMigrationFailed: HttpStatus.INTERNAL_SERVER_ERROR,
  tenantSchemaCreationFailed: HttpStatus.INTERNAL_SERVER_ERROR,
  tenantSmokeCheckFailed: HttpStatus.INTERNAL_SERVER_ERROR,
  invalidProvisioningRun: HttpStatus.INTERNAL_SERVER_ERROR,
  invalidProvisioningTransition: HttpStatus.CONFLICT,
};

export const mapDomainErrorToHttp = (
  error: DomainError,
): HttpErrorDescriptor => ({
  code: error.code,
  statusCode: statusByCode[error.code],
  message: error.message,
  ...(error.details?.length ? { details: error.details } : {}),
});
