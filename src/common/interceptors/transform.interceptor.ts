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

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T> | undefined
> {
  constructor(private readonly contextStore: ExecutionContextStore) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | undefined> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (response.statusCode === 204) return undefined;
        return {
          data,
          meta: { requestId: this.contextStore.require().requestId },
        };
      }),
    );
  }
}
