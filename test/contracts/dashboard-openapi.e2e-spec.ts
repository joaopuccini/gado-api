import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('real dashboard OpenAPI contract', () => {
  let app: INestApplication;
  let paths: Record<string, unknown>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'dashboard-contract-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    paths = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Gado API').addBearerAuth().build(),
    ).paths;
  });

  afterAll(async () => app?.close());

  it('publishes only the authenticated dashboard summary', () => {
    expect(paths).toHaveProperty('/dashboard/summary');
    expect(paths).not.toHaveProperty('/dashboard/stats');
    expect(paths).not.toHaveProperty('/dashboard/evolucao_peso');
    const summary = paths['/dashboard/summary'] as { get?: Record<string, unknown> };
    expect(summary.get?.operationId).toBe('getFarmDashboard');
    expect(summary.get?.security).toEqual(expect.any(Array));
    expect(summary.get?.responses).toEqual(
      expect.objectContaining({ '200': expect.any(Object), '401': expect.any(Object), '403': expect.any(Object) }),
    );
  });
});
