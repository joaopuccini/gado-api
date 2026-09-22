import { type INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

const accountReadPaths = [
  '/api/v1/account/organization',
  '/api/v1/account/subscription',
] as const;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const hasJsonSchema = (response: unknown): boolean => {
  const content = asRecord(asRecord(response)?.content);
  const json = asRecord(content?.['application/json']);
  return asRecord(json?.schema) !== undefined;
};

const accountOperationsOf = (document: OpenAPIObject) =>
  Object.entries(document.paths)
    .filter(([path]) => path.startsWith('/api/v1/account/'))
    .flatMap(([path, pathItem]) =>
      ['get', 'post', 'put', 'patch', 'delete'].flatMap((method) => {
        const operation = asRecord(pathItem?.[method as keyof typeof pathItem]);
        return operation ? [{ path, method, operation }] : [];
      }),
    );

describe('Account OpenAPI contract', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'contract-test-secret';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Gado API').addBearerAuth().build(),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('documents every account operation with auth and explicit envelopes', () => {
    const violations = accountOperationsOf(document).flatMap(
      ({ path, method, operation }) => {
        const responses = asRecord(operation.responses) ?? {};
        const successCode = Object.keys(responses).find((code) =>
          /^2\d\d$/.test(code),
        );
        const requiredErrors = [
          ...(method === 'get' || method === 'delete' ? [] : ['400']),
          '401',
          '403',
          '500',
        ];
        const failures = [
          typeof operation.operationId === 'string' &&
          /^[a-z][a-zA-Z0-9]*$/.test(operation.operationId)
            ? undefined
            : 'operationId',
          Array.isArray(operation.security) && operation.security.length > 0
            ? undefined
            : 'security',
          successCode &&
          hasJsonSchema(responses[successCode]) &&
          JSON.stringify(responses[successCode]).includes('ApiSuccessDto')
            ? undefined
            : 'successEnvelope',
          ...requiredErrors.map((status) =>
            hasJsonSchema(responses[status]) ? undefined : `response${status}`,
          ),
        ].filter(Boolean);
        return failures.length > 0
          ? [`${method.toUpperCase()} ${path}: ${failures.join(',')}`]
          : [];
      },
    );

    expect(violations).toEqual([]);
  });

  it.each(accountReadPaths)(
    'publishes the authenticated read operation %s with explicit envelopes',
    (path) => {
      const pathItem = document.paths[path];
      expect(pathItem).toBeDefined();

      const operation = asRecord(pathItem?.get);
      expect(operation).toBeDefined();
      expect(operation?.operationId).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      expect(operation?.security).toEqual(
        expect.arrayContaining([expect.objectContaining({ bearer: [] })]),
      );

      const responses = asRecord(operation?.responses) ?? {};
      for (const status of ['200', '401', '403', '500']) {
        expect(hasJsonSchema(responses[status])).toBe(true);
      }

      const successSchema = JSON.stringify(responses['200']);
      expect(successSchema).toContain('ApiSuccessDto');
      expect(successSchema).not.toMatch(
        /schemaName|senha|password|token|prisma/i,
      );
    },
  );

  it.each(accountReadPaths)(
    'does not expose an account-side mutation for admin-owned resource %s',
    (path) => {
      const pathItem = document.paths[path];
      expect(pathItem).toBeDefined();
      expect(pathItem?.post).toBeUndefined();
      expect(pathItem?.put).toBeUndefined();
      expect(pathItem?.patch).toBeUndefined();
      expect(pathItem?.delete).toBeUndefined();
    },
  );
});
