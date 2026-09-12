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
  animalNotFound: HttpStatus.NOT_FOUND,
  internalServerError: HttpStatus.INTERNAL_SERVER_ERROR,
};

export const mapDomainErrorToHttp = (
  error: DomainError,
): HttpErrorDescriptor => ({
  code: error.code,
  statusCode: statusByCode[error.code],
  message: error.message,
  ...(error.details?.length ? { details: error.details } : {}),
});
