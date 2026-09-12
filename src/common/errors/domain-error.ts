import type { ErrorCode, ErrorDetail } from './error-catalog';

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: readonly ErrorDetail[],
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
