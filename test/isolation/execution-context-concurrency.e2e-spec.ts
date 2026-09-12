import {
  Controller,
  Get,
  type INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  Param,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  ExecutionContextMiddleware,
  ExecutionContextStore,
} from '../../src/common/context';

@Controller('execution-context-probe')
class ExecutionContextProbeController {
  constructor(private readonly contextStore: ExecutionContextStore) {}

  @Get(':tenantId/:delay')
  async inspect(
    @Param('tenantId') tenantId: string,
    @Param('delay') delay: string,
  ) {
    this.contextStore.enrichTenant({
      tenantId,
      organizationId: `organization-${tenantId}`,
      schemaName: `tenant_${tenantId.toLowerCase()}`,
      globalUserId: `global-${tenantId}`,
      localUserId: 1,
      farmId: 1,
      accessibleFarmIds: [1],
      permissions: ['animals.read'],
    });

    await new Promise((resolve) => setTimeout(resolve, Number(delay)));

    const context = this.contextStore.requireTenant();
    return {
      requestId: context.requestId,
      tenantId: context.tenantId,
      schemaName: context.schemaName,
    };
  }
}

@Module({
  controllers: [ExecutionContextProbeController],
  providers: [ExecutionContextStore, ExecutionContextMiddleware],
})
class ExecutionContextProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ExecutionContextMiddleware).forRoutes('*');
  }
}

describe('Execution context isolation (e2e)', () => {
  let app: INestApplication;

  const httpServer = (): Parameters<typeof request>[0] =>
    app.getHttpServer() as Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExecutionContextProbeModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('preserves request and tenant identity across concurrent requests', async () => {
    const requestA = '309709aa-e800-4f98-867c-826eae3fdb53';
    const requestB = 'b5c3b8d6-0eab-4b6c-9131-4d6395e73a43';

    const [responseA, responseB] = await Promise.all([
      request(httpServer())
        .get('/execution-context-probe/tenantA/30')
        .set('x-request-id', requestA)
        .expect(200),
      request(httpServer())
        .get('/execution-context-probe/tenantB/5')
        .set('x-request-id', requestB)
        .expect(200),
    ]);

    expect(responseA.body).toEqual({
      requestId: requestA,
      tenantId: 'tenantA',
      schemaName: 'tenant_tenanta',
    });
    expect(responseB.body).toEqual({
      requestId: requestB,
      tenantId: 'tenantB',
      schemaName: 'tenant_tenantb',
    });
  });

  it('replaces an invalid client request id with a server-generated UUID', async () => {
    const response = await request(httpServer())
      .get('/execution-context-probe/tenantA/0')
      .set('x-request-id', 'attacker-controlled-value')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    const body = response.body as { requestId: string };
    const responseRequestId = response.headers['x-request-id'];
    expect(body.requestId).toBe(responseRequestId);
  });
});
