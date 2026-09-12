import {
  BadRequestException,
  type ArgumentsHost,
  type HttpArgumentsHost,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ExecutionContextStore, type ExecutionContextData } from '../context';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import { DomainError } from './domain-error';
import { mapDomainErrorToHttp } from './error-http.mapper';

const executionContext: ExecutionContextData = {
  requestId: '309709aa-e800-4f98-867c-826eae3fdb53',
  traceId: '45229eb1-af7d-4a65-a67c-5a60a1f0b028',
  contextType: 'public',
  startedAt: Date.now(),
  method: 'GET',
  path: '/probe/unexpected',
  accessibleFarmIds: [],
  permissions: [],
};

interface CapturedResponse {
  statusCode?: number;
  body?: Record<string, unknown>;
}

const createHost = (captured: CapturedResponse): ArgumentsHost => {
  const request = {
    method: 'GET',
    originalUrl: '/probe/unexpected',
    url: '/probe/unexpected',
  } as Request;
  const response = {
    status(statusCode: number) {
      captured.statusCode = statusCode;
      return this;
    },
    json(body: Record<string, unknown>) {
      captured.body = body;
      return this;
    },
  } as unknown as Response;
  const httpHost: HttpArgumentsHost = {
    getRequest: <T = Request>() => request as T,
    getResponse: <T = Response>() => response as T,
    getNext: <T = unknown>() => undefined as T,
  };

  return {
    switchToHttp: () => httpHost,
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getType: () => 'http',
  };
};

describe('Global error contract', () => {
  it.each([
    ['validationFailed', 400],
    ['unauthenticated', 401],
    ['forbidden', 403],
    ['animalNotFound', 404],
  ] as const)('maps %s to its stable HTTP status', (code, statusCode) => {
    expect(
      mapDomainErrorToHttp(new DomainError(code, `domain error: ${code}`)),
    ).toMatchObject({ code, statusCode });
  });

  it('normalizes class-validator failures into camelCase details', () => {
    const store = new ExecutionContextStore();
    const filter = new GlobalExceptionFilter(store);
    const captured: CapturedResponse = {};

    store.run(executionContext, () =>
      filter.catch(
        new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: ['email must be an email'],
        }),
        createHost(captured),
      ),
    );

    expect(captured).toMatchObject({
      statusCode: 400,
      body: {
        error: {
          code: 'validationFailed',
          message: 'Falha de validação',
          details: [{ reason: 'email must be an email' }],
        },
        meta: {
          requestId: executionContext.requestId,
          path: '/probe/unexpected',
        },
      },
    });
  });

  it('hides unknown exception internals and legacy response fields', () => {
    const store = new ExecutionContextStore();
    const filter = new GlobalExceptionFilter(store);
    const captured: CapturedResponse = {};
    const internalError = Object.assign(new Error('SQL password leaked'), {
      sql: 'select secret from credentials',
      module: 'database',
    });

    store.run(executionContext, () =>
      filter.catch(internalError, createHost(captured)),
    );

    expect(captured).toMatchObject({
      statusCode: 500,
      body: {
        error: {
          code: 'internalServerError',
          message: 'Erro interno do servidor',
        },
        meta: {
          requestId: executionContext.requestId,
          path: '/probe/unexpected',
        },
      },
    });
    expect(captured.body).not.toHaveProperty('success');
    expect(captured.body).not.toHaveProperty('statusCode');
    expect(captured.body).not.toHaveProperty('error.statusCode');
    expect(captured.body).not.toHaveProperty('error.stack');
    expect(captured.body).not.toHaveProperty('error.sql');
    expect(captured.body).not.toHaveProperty('error.module');
    expect(JSON.stringify(captured.body)).not.toContain('SQL password leaked');
    expect(JSON.stringify(captured.body)).not.toMatch(/[A-Z]+_[A-Z_]+/);
  });
});
