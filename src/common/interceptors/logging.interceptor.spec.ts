import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';
import { ExecutionContextStore, type ExecutionContextData } from '../context';
import {
  StructuredLogger,
  type LogSink,
  type StructuredLogRecord,
} from '../logger/structured-logger.service';
import { LoggingInterceptor } from './logging.interceptor';

class MemoryLogSink implements LogSink {
  readonly lines: string[] = [];

  write(line: string): void {
    this.lines.push(line);
  }

  records(): StructuredLogRecord[] {
    return this.lines.map((line) => JSON.parse(line) as StructuredLogRecord);
  }
}

class ProbeController {
  listAnimals(): void {}
}

const requestContext: ExecutionContextData = {
  requestId: 'request-a',
  traceId: 'trace-a',
  contextType: 'public',
  startedAt: Date.now() - 5,
  method: 'GET',
  path: '/animals',
  accessibleFarmIds: [],
  permissions: [],
};

const httpExecutionContext = (statusCode: number): ExecutionContext => {
  const request = {
    method: 'GET',
    originalUrl: '/animals',
  } as Request;
  const response = { statusCode } as Response;

  return {
    switchToHttp: () => ({
      getRequest: <T = Request>() => request as T,
      getResponse: <T = Response>() => response as T,
      getNext: <T = unknown>(): T => {
        throw new Error('getNext is not used by this test');
      },
    }),
    getClass: () => ProbeController,
    getHandler: () => ProbeController.prototype.listAnimals,
  } as unknown as ExecutionContext;
};

describe('LoggingInterceptor', () => {
  it('writes exactly one start and completion record on success', async () => {
    const store = new ExecutionContextStore();
    const sink = new MemoryLogSink();
    const logger = new StructuredLogger(store, sink);
    const interceptor = new LoggingInterceptor(logger);
    const next: CallHandler = { handle: () => of({ secret: 'response body' }) };

    await store.run(requestContext, () =>
      lastValueFrom(interceptor.intercept(httpExecutionContext(200), next)),
    );

    expect(sink.records()).toHaveLength(2);
    expect(sink.records()).toEqual([
      expect.objectContaining({
        event: 'httpRequestStarted',
        module: 'ProbeController',
        operation: 'listAnimals',
      }),
      expect.objectContaining({
        event: 'httpRequestCompleted',
        statusCode: 200,
        durationMs: expect.any(Number),
        outcome: 'success',
      }),
    ]);
    expect(sink.lines.join('\n')).not.toContain('response body');
  });

  it('writes exactly one error completion with the mapped status', async () => {
    const store = new ExecutionContextStore();
    const sink = new MemoryLogSink();
    const logger = new StructuredLogger(store, sink);
    const interceptor = new LoggingInterceptor(logger);
    const next: CallHandler = {
      handle: () => throwError(() => new BadRequestException()),
    };

    await expect(
      store.run(requestContext, () =>
        lastValueFrom(interceptor.intercept(httpExecutionContext(200), next)),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(sink.records()).toHaveLength(2);
    expect(sink.records()[1]).toMatchObject({
      event: 'httpRequestCompleted',
      statusCode: 400,
      outcome: 'error',
    });
  });
});
