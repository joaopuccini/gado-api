import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { finalize, Observable, tap } from 'rxjs';
import { StructuredLogger } from '../logger/structured-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    const fields = {
      method: request.method,
      path: request.originalUrl,
      module: context.getClass().name,
      operation: context.getHandler().name,
    };
    let outcome: 'success' | 'error' = 'success';
    let errorStatusCode: number | undefined;

    this.logger.info('httpRequestStarted', fields);

    return next.handle().pipe(
      tap({
        error: (error: unknown) => {
          outcome = 'error';
          errorStatusCode =
            error instanceof HttpException ? error.getStatus() : 500;
        },
      }),
      finalize(() => {
        this.logger.info('httpRequestCompleted', {
          ...fields,
          statusCode: errorStatusCode ?? response.statusCode,
          durationMs: Math.max(0, Date.now() - startedAt),
          outcome,
        });
      }),
    );
  }
}
