import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

describe('Movement OpenAPI contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'contract-test-secret';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('documents movement history as a canonical paginated envelope', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Gado API').addBearerAuth().build(),
    );
    const operation = document.paths['/api/v1/animal-movements/history']?.get;
    const response = asRecord(operation?.responses?.['200']);
    const content = asRecord(response?.content);
    const json = asRecord(content?.['application/json']);
    const schema = asRecord(json?.schema);
    const allOf = Array.isArray(schema?.allOf) ? schema.allOf : [];
    const concrete = asRecord(allOf[1]);
    const properties = asRecord(concrete?.properties);
    const data = asRecord(properties?.data);
    const meta = asRecord(properties?.meta);

    expect(data).toMatchObject({ type: 'array' });
    expect(JSON.stringify(data)).toContain('MovementResponseDto');
    expect(JSON.stringify(meta)).toContain('pageSize');
    expect(JSON.stringify(meta)).toContain('totalItems');
    expect(JSON.stringify(meta)).toContain('totalPages');
    expect(JSON.stringify(schema)).not.toContain(
      'MovementHistoryPageResponseDto',
    );
  });
});
