import { type INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../../src/app.module';

interface LegacyRouteQuarantineEntry {
  readonly controller: string;
}

interface DocumentOperation {
  readonly method: string;
  readonly path: string;
  readonly operation: Record<string, unknown>;
}

const httpMethods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
]);
const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const operationsOf = (document: OpenAPIObject): DocumentOperation[] =>
  Object.entries(document.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem ?? {}).flatMap(([method, operation]) => {
      const operationRecord = asRecord(operation);
      return httpMethods.has(method) && operationRecord
        ? [{ method, path, operation: operationRecord }]
        : [];
    }),
  );

const operationIdOf = (operation: Record<string, unknown>): string =>
  typeof operation.operationId === 'string' ? operation.operationId : '';

const responseCodesOf = (operation: Record<string, unknown>): string[] =>
  Object.keys(asRecord(operation.responses) ?? {});

const hasJsonSchema = (value: unknown): boolean => {
  const response = asRecord(value);
  const content = asRecord(response?.content);
  const json = asRecord(content?.['application/json']);
  return asRecord(json?.schema) !== undefined;
};

const hasSuccessEnvelopeSchema = (value: unknown): boolean => {
  const response = asRecord(value);
  const content = asRecord(response?.content);
  const json = asRecord(content?.['application/json']);
  const schema = asRecord(json?.schema);
  if (!schema) return false;

  const properties = asRecord(schema.properties);
  return (
    (properties?.data !== undefined && properties.meta !== undefined) ||
    JSON.stringify(schema).includes('ApiSuccessDto')
  );
};

const collectSchemaReferences = (
  value: unknown,
  references: Set<string>,
): void => {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSchemaReferences(entry, references));
    return;
  }
  const record = asRecord(value);
  if (!record) return;

  const reference = record.$ref;
  if (
    typeof reference === 'string' &&
    reference.startsWith('#/components/schemas/')
  ) {
    references.add(reference.slice('#/components/schemas/'.length));
  }
  Object.values(record).forEach((entry) =>
    collectSchemaReferences(entry, references),
  );
};

describe('OpenAPI completeness', () => {
  let app: INestApplication;
  let document: OpenAPIObject;
  let operations: DocumentOperation[];
  let newOperations: DocumentOperation[];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'contract-test-secret';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();

    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Gado API').addBearerAuth().build(),
    );
    operations = operationsOf(document);

    const parsedQuarantine = JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'test/fixtures/legacy-route-quarantine.json'),
        'utf8',
      ),
    ) as unknown;
    if (!Array.isArray(parsedQuarantine)) {
      throw new Error('legacyRouteQuarantineMustBeAnArray');
    }
    const legacyControllers = new Set(
      (parsedQuarantine as LegacyRouteQuarantineEntry[]).map(
        ({ controller }) => controller,
      ),
    );
    newOperations = operations.filter(({ operation }) =>
      [...legacyControllers].every(
        (controller) => !operationIdOf(operation).startsWith(`${controller}_`),
      ),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('publishes unique and non-empty operationIds for every endpoint', () => {
    const operationIds = operations.map(({ operation }) =>
      operationIdOf(operation),
    );

    expect(operationIds.every((operationId) => operationId.length > 0)).toBe(
      true,
    );
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('uses context tags and coherent bearer security on new endpoints', () => {
    const violations = newOperations.flatMap(({ path, method, operation }) => {
      const tags = Array.isArray(operation.tags) ? operation.tags : [];
      const security = Array.isArray(operation.security)
        ? operation.security
        : [];
      const expectedTag = path.startsWith('/admin')
        ? 'Admin'
        : path.startsWith('/account')
          ? 'Account'
          : 'Gado App';
      const isPublic = path.startsWith('/auth') || path.startsWith('/health');
      const failures = [
        typeof operation.summary === 'string' && operation.summary.trim()
          ? undefined
          : 'operationSummary',
        tags.includes(expectedTag) ? undefined : 'tag',
        isPublic || security.length > 0 ? undefined : 'security',
      ].filter(Boolean);
      return failures.length > 0
        ? [`${method.toUpperCase()} ${path}: ${failures.join(',')}`]
        : [];
    });

    expect(violations).toEqual([]);
  });

  it('documents typed input for body, query and path parameters on new endpoints', () => {
    const violations = newOperations.flatMap(({ path, method, operation }) => {
      const failures: string[] = [];
      const requestBody = asRecord(operation.requestBody);
      if (requestBody && !hasJsonSchema(requestBody)) failures.push('body');

      const parameters = Array.isArray(operation.parameters)
        ? operation.parameters
        : [];
      parameters.forEach((parameter, index) => {
        const parameterRecord = asRecord(parameter);
        const name = parameterRecord?.name;
        if (
          !parameterRecord ||
          typeof name !== 'string' ||
          !camelCasePattern.test(name) ||
          !asRecord(parameterRecord.schema)
        ) {
          failures.push(`parameter[${index}]`);
        }
      });

      return failures.length > 0
        ? [`${method.toUpperCase()} ${path}: ${failures.join(',')}`]
        : [];
    });

    expect(violations).toEqual([]);
  });

  it('documents a typed 2xx envelope and common errors on new endpoints', () => {
    const violations = newOperations.flatMap(({ path, method, operation }) => {
      const responses = asRecord(operation.responses) ?? {};
      const responseCodes = responseCodesOf(operation);
      const successCode = responseCodes.find((code) => /^2\d\d$/.test(code));
      const requiredErrors = new Set(['500']);
      if (['post', 'put', 'patch'].includes(method)) requiredErrors.add('400');
      const isPublic = path.startsWith('/auth') || path.startsWith('/health');
      if (!isPublic) {
        requiredErrors.add('401');
        requiredErrors.add('403');
      }

      const failures = [
        successCode && hasSuccessEnvelopeSchema(responses[successCode])
          ? undefined
          : 'typed2xxEnvelope',
        ...[...requiredErrors].flatMap((code) =>
          responseCodes.includes(code) && hasJsonSchema(responses[code])
            ? []
            : [`response${code}`],
        ),
      ].filter((failure): failure is string => failure !== undefined);
      return failures.length > 0
        ? [`${method.toUpperCase()} ${path}: ${failures.join(',')}`]
        : [];
    });

    expect(violations).toEqual([]);
  });

  it('keeps every new public contract property strictly camelCase', () => {
    const referencedSchemas = new Set<string>();
    newOperations.forEach(({ operation }) =>
      collectSchemaReferences(operation, referencedSchemas),
    );

    const schemas = document.components?.schemas ?? {};
    const pending = [...referencedSchemas];
    while (pending.length > 0) {
      const schemaName = pending.pop();
      if (!schemaName) continue;
      const before = referencedSchemas.size;
      collectSchemaReferences(schemas[schemaName], referencedSchemas);
      if (referencedSchemas.size > before) {
        pending.push(
          ...[...referencedSchemas].filter(
            (reference) => reference !== schemaName,
          ),
        );
      }
    }

    const violations = [...referencedSchemas].flatMap((schemaName) => {
      const schema = asRecord(schemas[schemaName]);
      const properties = asRecord(schema?.properties) ?? {};
      return Object.keys(properties)
        .filter((property) => !camelCasePattern.test(property))
        .map((property) => `${schemaName}.${property}`);
    });

    expect(violations).toEqual([]);
  });
});
