import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../src/common/context';
import { TenantPrismaClientFactory } from '../../src/tenant/infrastructure/tenant-prisma-client.factory';
import { TenantSchemaName } from '../../src/tenant/infrastructure/schema-name';
import { TenantPrismaService } from '../../src/tenant/tenant-prisma.service';

jest.setTimeout(30_000);

const disposableSchema = (): TenantSchemaName =>
  TenantSchemaName.parse(`tenant_${randomBytes(16).toString('hex')}`);

const quotedSchema = (schema: TenantSchemaName): string => `"${schema.value}"`;

const tenantContext = (
  schema: TenantSchemaName,
  tenantId: string,
  farmId: number,
): ExecutionContextData => ({
  requestId: `request-${tenantId}`,
  traceId: `trace-${tenantId}`,
  contextType: 'tenant',
  startedAt: Date.now(),
  tenantId,
  organizationId: `organization-${tenantId}`,
  schemaName: schema.value,
  globalUserId: `user-${tenantId}`,
  localUserId: farmId,
  farmId,
  accessibleFarmIds: [farmId],
  permissions: ['animals.read'],
});

describe('Tenant persistence isolation (e2e)', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for persistence isolation');
  }

  const schemaA = disposableSchema();
  const schemaB = disposableSchema();
  const adminPool = new Pool({ connectionString: databaseUrl, max: 1 });
  const contextStore = new ExecutionContextStore();
  const factory = new TenantPrismaClientFactory(
    new ConfigService({ DATABASE_URL: databaseUrl }),
  );
  const service = new TenantPrismaService(contextStore, factory);

  beforeAll(async () => {
    for (const [schema, marker] of [
      [schemaA, 'tenantA'],
      [schemaB, 'tenantB'],
    ] as const) {
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
      await adminPool.query(
        `INSERT INTO ${quotedSchema(schema)}."racas" ("descricao") VALUES ($1)`,
        [marker],
      );
    }
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

  it('keeps schema and farm identity isolated under concurrent work', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const read = (schema: TenantSchemaName, tenantId: string, farmId: number) =>
      contextStore.run(tenantContext(schema, tenantId, farmId), async () => {
        await gate;
        const rows = await service.getClient().raca.findMany();
        return {
          marker: rows[0]?.descricao,
          farmId: service.getContext().farmId,
        };
      });

    const resultA = read(schemaA, 'tenant-a', 10);
    const resultB = read(schemaB, 'tenant-b', 20);
    release();

    await expect(Promise.all([resultA, resultB])).resolves.toEqual([
      { marker: 'tenantA', farmId: 10 },
      { marker: 'tenantB', farmId: 20 },
    ]);
  });
});
