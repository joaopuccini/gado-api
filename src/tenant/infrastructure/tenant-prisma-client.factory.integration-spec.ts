import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { TenantPrismaClientFactory } from './tenant-prisma-client.factory';
import { TenantSchemaName } from '../domain/tenant-schema-name';

jest.setTimeout(30_000);

const disposableSchema = (): TenantSchemaName =>
  TenantSchemaName.parse(`tenant_${randomBytes(16).toString('hex')}`);

const quotedSchema = (schema: TenantSchemaName): string => `"${schema.value}"`;

describe('TenantPrismaClientFactory PostgreSQL isolation', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'TEST_DATABASE_URL is required for the tenant isolation integration test',
    );
  }

  const schemaA = disposableSchema();
  const schemaB = disposableSchema();
  const adminPool = new Pool({ connectionString: databaseUrl, max: 1 });
  const factory = new TenantPrismaClientFactory(
    new ConfigService({ DATABASE_URL: databaseUrl }),
  );

  beforeAll(async () => {
    for (const schema of [schemaA, schemaB]) {
      await adminPool.query(`CREATE SCHEMA ${quotedSchema(schema)}`);
      await adminPool.query(`
        CREATE TABLE ${quotedSchema(schema)}."racas" (
          "id" serial PRIMARY KEY,
          "descricao" varchar(100) NOT NULL,
          "ativo" boolean NOT NULL DEFAULT true,
          "createdAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    await adminPool.query(
      `INSERT INTO ${quotedSchema(schemaA)}."racas" ("descricao") VALUES ($1)`,
      ['tenantA'],
    );
    await adminPool.query(
      `INSERT INTO ${quotedSchema(schemaB)}."racas" ("descricao") VALUES ($1)`,
      ['tenantB'],
    );
  });

  afterAll(async () => {
    await factory.disposeAll();
    for (const schema of [schemaA, schemaB]) {
      await adminPool.query(
        `DROP SCHEMA IF EXISTS ${quotedSchema(schema)} CASCADE`,
      );
    }
    await adminPool.end();
  });

  it('binds each client to exactly one schema without SQL rewriting', async () => {
    const clientA = factory.create(schemaA);
    const clientB = factory.create(schemaB);
    const queries: string[] = [];
    clientA.$on('query', ({ query }) => queries.push(query));
    clientB.$on('query', ({ query }) => queries.push(query));

    const rowsA = await clientA.raca.findMany();
    const rowsB = await clientB.raca.findMany();

    expect(rowsA).toEqual([expect.objectContaining({ descricao: 'tenantA' })]);
    expect(rowsB).toEqual([expect.objectContaining({ descricao: 'tenantB' })]);
    expect(rowsA).not.toContainEqual(
      expect.objectContaining({ descricao: 'tenantB' }),
    );
    expect(rowsB).not.toContainEqual(
      expect.objectContaining({ descricao: 'tenantA' }),
    );
    expect(queries.join('\n')).not.toContain('"public"');
    expect(queries.join('\n')).not.toMatch(/set\s+search_path/i);
  });
});
