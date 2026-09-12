import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { NextFunction, Request, Response } from 'express';
import { ExecutionContextStore } from './execution-context.store';

const validCorrelationId = (value: unknown): value is string =>
  typeof value === 'string' && isUUID(value);

@Injectable()
export class ExecutionContextMiddleware implements NestMiddleware {
  constructor(private readonly contextStore: ExecutionContextStore) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = validCorrelationId(request.headers['x-request-id'])
      ? request.headers['x-request-id']
      : randomUUID();
    const traceId = validCorrelationId(request.headers['x-trace-id'])
      ? request.headers['x-trace-id']
      : randomUUID();

    response.setHeader('x-request-id', requestId);
    response.setHeader('x-trace-id', traceId);

    this.contextStore.run(
      {
        requestId,
        traceId,
        contextType: 'public',
        startedAt: Date.now(),
        method: request.method,
        path: request.originalUrl,
        accessibleFarmIds: [],
        permissions: [],
      },
      next,
    );
  }
}
