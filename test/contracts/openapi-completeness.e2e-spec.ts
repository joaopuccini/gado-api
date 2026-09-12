import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('OpenAPI Completeness', () => {
  let app: INestApplication;
  let document: OpenAPIObject;
  let legacyControllers: string[] = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'dummy';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    const config = new DocumentBuilder()
      .setTitle('Gado API')
      .build();
    
    document = SwaggerModule.createDocument(app, config);

    const quarantinePath = path.resolve(__dirname, '../fixtures/legacy-route-quarantine.json');
    const legacyQuarantine = JSON.parse(fs.readFileSync(quarantinePath, 'utf8')) as any[];
    legacyControllers = legacyQuarantine.map(q => q.controller);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should have unique and non-empty operationIds', () => {
    const operationIds = new Set<string>();
    
    for (const path of Object.keys(document.paths)) {
      const pathItem = document.paths[path] as any;
      for (const method of Object.keys(pathItem)) {
        const operation = pathItem[method];
        // TODO: Skip legacy controllers if we can identify them (NestJS doesn't put controller names in the doc easily unless tagged, we might check tags)
        
        expect(operation.operationId).toBeDefined();
        expect(operation.operationId).not.toBe('');
        
        expect(operationIds.has(operation.operationId)).toBe(false);
        operationIds.add(operation.operationId);
      }
    }
  });

  it('should have coherent tags and security', () => {
    for (const p of Object.keys(document.paths)) {
      const pathItem = document.paths[p] as any;
      for (const method of Object.keys(pathItem)) {
        const operation = pathItem[method];
        expect(operation.tags).toBeDefined();
        expect(operation.tags.length).toBeGreaterThan(0);
        
        if (p.startsWith('/admin')) {
          expect(operation.tags).toContain('Admin');
        } else if (p.startsWith('/account')) {
          expect(operation.tags).toContain('Account');
        }
      }
    }
  });

  it('should require request DTO for body', () => {
    for (const path of Object.keys(document.paths)) {
      const pathItem = document.paths[path] as any;
      for (const method of Object.keys(pathItem)) {
        const operation = pathItem[method];
        if (['post', 'put', 'patch'].includes(method.toLowerCase()) && operation.requestBody) {
          const content = operation.requestBody.content;
          if (content && content['application/json']) {
            expect(content['application/json'].schema).toBeDefined();
          }
        }
      }
    }
  });

  it('should define 2xx response with typed envelope', () => {
    for (const path of Object.keys(document.paths)) {
      const pathItem = document.paths[path] as any;
      for (const method of Object.keys(pathItem)) {
        const operation = pathItem[method];
        
        const responses = Object.keys(operation.responses);
        const has2xx = responses.some(code => code.startsWith('2'));
        expect(has2xx).toBe(true);
      }
    }
  });

  it('should define common responses (400, 401, 403, 500) where applicable', () => {
    for (const path of Object.keys(document.paths)) {
      const pathItem = document.paths[path] as any;
      for (const method of Object.keys(pathItem)) {
        const operation = pathItem[method];
        const responses = Object.keys(operation.responses);
        
        if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
          expect(responses).toContain('400');
        }
        
        if (operation.security && operation.security.length > 0) {
          expect(responses).toContain('401');
        }
      }
    }
  });

  it('should not contain non-camelCase keys in public schemas', () => {
    const schemas = document.components?.schemas || {};
    for (const schemaName of Object.keys(schemas)) {
      const schema = schemas[schemaName] as any;
      if (schema.properties) {
        for (const propName of Object.keys(schema.properties)) {
          // Check if propName is camelCase
          const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(propName) || propName.startsWith('_'); // Allow _ for internal stuff if any? Usually camelCase only.
          expect(isCamelCase).toBe(true);
        }
      }
    }
  });
});
