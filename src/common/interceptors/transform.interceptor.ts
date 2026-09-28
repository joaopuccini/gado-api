import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';
import type { ApiSuccessResponse } from '../contracts/api-envelope';
import { ExecutionContextStore } from '../context';

interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

const isPaginatedResult = (
  value: unknown,
): value is PaginatedResult<unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.data) &&
    typeof candidate.page === 'number' &&
    typeof candidate.pageSize === 'number' &&
    typeof candidate.totalItems === 'number' &&
    typeof candidate.totalPages === 'number'
  );
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<unknown> | undefined
> {
  constructor(private readonly contextStore: ExecutionContextStore) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<unknown> | undefined> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (response.statusCode === 204) return undefined;
        if (isPaginatedResult(data)) {
          return {
            data: data.data,
            meta: {
              requestId: this.contextStore.require().requestId,
              page: data.page,
              pageSize: data.pageSize,
              totalItems: data.totalItems,
              totalPages: data.totalPages,
            },
          };
        }
        return {
          data,
          meta: { requestId: this.contextStore.require().requestId },
        };
      }),
    );
  }
}
