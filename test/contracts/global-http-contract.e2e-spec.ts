import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  type INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  Post,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ApiProperty } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import {
  ExecutionContextMiddleware,
  ExecutionContextStore,
} from '../../src/common/context';
import { DomainError } from '../../src/common/errors/domain-error';
import { GlobalExceptionFilter } from '../../src/common/filters';
import {
  LoggingInterceptor,
  TransformInterceptor,
} from '../../src/common/interceptors';
import {
  STRUCTURED_LOG_SINK,
  StructuredLogger,
} from '../../src/common/logger';
import { GlobalValidationPipe } from '../../src/common/pipes/global-validation.pipe';

class ProbeInputDto {
  @ApiProperty({ example: 'brinco-100' })
  @IsString()
  @IsNotEmpty()
  earTagNumber!: string;
}

@Controller('contract-probe')
class ContractProbeController {
  @Post()
  create(@Body() input: ProbeInputDto): ProbeInputDto {
    return input;
  }

  @Delete()
  @HttpCode(204)
  remove(): void {}

  @Get('domain-error')
  domainError(): never {
    throw new DomainError('animalNotFound', 'Animal não encontrado');
  }

  @Get('unexpected-error')
  unexpectedError(): never {
    throw new Error('database secret must not leak');
  }
}

@Module({
  controllers: [ContractProbeController],
  providers: [
    ExecutionContextStore,
    ExecutionContextMiddleware,
    StructuredLogger,
    { provide: STRUCTURED_LOG_SINK, useValue: { write() {} } },
    { provide: APP_PIPE, useClass: GlobalValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
class ContractProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ExecutionContextMiddleware).forRoutes('*');
  }
}

describe('Global HTTP contract (e2e)', () => {
  let app: INestApplication;
  const requestId = '309709aa-e800-4f98-867c-826eae3fdb53';
  const httpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ContractProbeModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a camelCase success envelope without legacy success flag', async () => {
    const response = await request(httpServer())
      .post('/contract-probe')
      .set('x-request-id', requestId)
      .send({ earTagNumber: 'brinco-100' })
      .expect(201);

    expect(response.body).toEqual({
      data: { earTagNumber: 'brinco-100' },
      meta: { requestId },
    });
    expect(response.body).not.toHaveProperty('success');
  });

  it('leaves a 204 response without a body', async () => {
    const response = await request(httpServer())
      .delete('/contract-probe')
      .set('x-request-id', requestId)
      .expect(204);

    expect(response.text).toBe('');
  });

  it('rejects extra input with the validation error contract', async () => {
    const response = await request(httpServer())
      .post('/contract-probe')
      .set('x-request-id', requestId)
      .send({ earTagNumber: 'brinco-100', tenantId: 'attacker-tenant' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: {
        code: 'validationFailed',
        details: [{ field: 'tenantId', reason: 'whitelistValidation' }],
      },
      meta: { requestId, path: '/contract-probe' },
    });
  });

  it('uses the same envelope for domain and unexpected errors', async () => {
    const [domainResponse, unexpectedResponse] = await Promise.all([
      request(httpServer())
        .get('/contract-probe/domain-error')
        .set('x-request-id', requestId)
        .expect(404),
      request(httpServer())
        .get('/contract-probe/unexpected-error')
        .set('x-request-id', requestId)
        .expect(500),
    ]);

    expect(domainResponse.body).toMatchObject({
      error: { code: 'animalNotFound', message: 'Animal não encontrado' },
      meta: { requestId },
    });
    expect(unexpectedResponse.body).toMatchObject({
      error: {
        code: 'internalServerError',
        message: 'Erro interno do servidor',
      },
      meta: { requestId },
    });
    expect(JSON.stringify(unexpectedResponse.body)).not.toContain(
      'database secret',
    );
  });
});
