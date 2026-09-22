import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../src/common/context';
import type {
  TenantMembershipRecord,
  TenantRegistryRecord,
  TenantRegistryRepository,
} from '../../src/identity-access/application/ports/tenant-registry.repository';
import { ResolveTenantContextUseCase } from '../../src/identity-access/application/use-cases/resolve-tenant-context.use-case';

jest.setTimeout(30_000);

interface HierarchicalMembership {
  readonly farmId: number;
  readonly parentId: number | null;
  readonly active: boolean;
  readonly role: string;
  readonly permissions: readonly string[];
}

const disposableSchema = (): string =>
  `tenant_${randomBytes(16).toString('hex')}`;

const quotedSchema = (schema: string): string => `"${schema}"`;

const requestContext = (requestId: string): ExecutionContextData => ({
  requestId,
  traceId: `trace-${requestId}`,
  contextType: 'public',
  startedAt: Date.now(),
  accessibleFarmIds: [],
  permissions: [],
});

describe('Account farm hierarchy isolation (e2e)', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for account isolation');
  }

  const schemaA = disposableSchema();
  const schemaB = disposableSchema();
  const pool = new Pool({ connectionString: databaseUrl, max: 4 });
  const store = new ExecutionContextStore();
  const tenants = new Map<string, TenantRegistryRecord>([
    [
      'tenant-a',
      {
        tenantId: 'tenant-a',
        organizationId: 'organization-a',
        schemaName: schemaA,
        subdomain: 'tenant-a',
        status: 'active',
      },
    ],
    [
      'tenant-b',
      {
        tenantId: 'tenant-b',
        organizationId: 'organization-b',
        schemaName: schemaB,
        subdomain: 'tenant-b',
        status: 'active',
      },
    ],
  ]);

  const registry: jest.Mocked<TenantRegistryRepository> = {
    findById: jest.fn(async (tenantId) => tenants.get(tenantId) ?? null),
    findMembership: jest.fn(async (tenant, globalUserId) => {
      await new Promise((resolve) =>
        setTimeout(resolve, tenant.tenantId === 'tenant-a' ? 20 : 5),
      );
      const result = await pool.query<HierarchicalMembership>(
        `SELECT
          uf."farmId" AS "farmId",
          f."parentId" AS "parentId",
          f."active" AS "active",
          uf."role" AS "role",
          ARRAY['animals.read']::text[] AS "permissions"
        FROM ${quotedSchema(tenant.schemaName)}."user_farms" uf
        JOIN ${quotedSchema(tenant.schemaName)}."farms" f
          ON f."id" = uf."farmId"
        WHERE uf."globalUserId" = $1 AND uf."active" = true AND f."active" = true
        ORDER BY f."id"`,
        [globalUserId],
      );
      if (result.rows.length === 0) return null;
      return {
        localUserId: tenant.tenantId === 'tenant-a' ? 101 : 201,
        farms: result.rows,
      } as TenantMembershipRecord;
    }),
  };
  const useCase = new ResolveTenantContextUseCase(registry, store);

  beforeAll(async () => {
    for (const schema of [schemaA, schemaB]) {
      await pool.query(`CREATE SCHEMA ${quotedSchema(schema)}`);
      await pool.query(`
        CREATE TABLE ${quotedSchema(schema)}."farms" (
          "id" integer PRIMARY KEY,
          "parentId" integer NULL,
          "active" boolean NOT NULL
        )
      `);
      await pool.query(`
        CREATE TABLE ${quotedSchema(schema)}."user_farms" (
          "globalUserId" text NOT NULL,
          "farmId" integer NOT NULL,
          "role" text NOT NULL,
          "active" boolean NOT NULL
        )
      `);
    }

    await pool.query(
      `INSERT INTO ${quotedSchema(schemaA)}."farms" ("id", "parentId", "active")
       VALUES (10, NULL, true), (11, 10, true), (12, NULL, true)`,
    );
    await pool.query(
      `INSERT INTO ${quotedSchema(schemaA)}."user_farms"
        ("globalUserId", "farmId", "role", "active")
       VALUES ('user-a', 10, 'DONO', true), ('user-a', 11, 'COLABORADOR', true),
              ('user-a', 12, 'DONO', true)`,
    );
    await pool.query(
      `INSERT INTO ${quotedSchema(schemaB)}."farms" ("id", "parentId", "active")
       VALUES (20, NULL, true), (21, 20, true)`,
    );
    await pool.query(
      `INSERT INTO ${quotedSchema(schemaB)}."user_farms"
        ("globalUserId", "farmId", "role", "active")
       VALUES ('user-b', 20, 'DONO', true), ('user-b', 21, 'COLABORADOR', true)`,
    );
  });

  afterAll(async () => {
    for (const schema of [schemaA, schemaB]) {
      await pool.query(`DROP SCHEMA IF EXISTS ${quotedSchema(schema)} CASCADE`);
    }
    await pool.end();
  });

  const resolve = (
    tenantId: string,
    organizationId: string,
    globalUserId: string,
    farmId: number,
  ) =>
    store.run(requestContext(`${tenantId}-${farmId}`), () =>
      useCase.execute({
        verifiedSubject: globalUserId,
        tenantId,
        verifiedOrganizationId: organizationId,
        requestedFarmId: farmId,
        hostTenant: tenantId,
      }),
    );

  it('keeps concurrent tenant and hierarchy scopes fail-closed', async () => {
    const [rootA, childA, rootB] = await Promise.all([
      resolve('tenant-a', 'organization-a', 'user-a', 10),
      resolve('tenant-a', 'organization-a', 'user-a', 11),
      resolve('tenant-b', 'organization-b', 'user-b', 20),
    ]);

    expect(rootA).toMatchObject({
      tenantId: 'tenant-a',
      schemaName: schemaA,
      farmId: 10,
      accessibleFarmIds: [10, 11],
    });
    expect(childA).toMatchObject({
      tenantId: 'tenant-a',
      schemaName: schemaA,
      farmId: 11,
      accessibleFarmIds: [11],
    });
    expect(rootB).toMatchObject({
      tenantId: 'tenant-b',
      schemaName: schemaB,
      farmId: 20,
      accessibleFarmIds: [20, 21],
    });
    expect(rootA.accessibleFarmIds).not.toContain(12);
    expect(rootA.accessibleFarmIds).not.toContain(20);
  });

  it('denies a farm belonging to another tenant', async () => {
    await expect(
      resolve('tenant-a', 'organization-a', 'user-a', 20),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('fails before registry persistence when execution context is absent', async () => {
    registry.findById.mockClear();
    registry.findMembership.mockClear();

    await expect(
      useCase.execute({
        verifiedSubject: 'user-a',
        tenantId: 'tenant-a',
        verifiedOrganizationId: 'organization-a',
        requestedFarmId: 10,
      }),
    ).rejects.toMatchObject({ code: 'executionContextMissing' });

    expect(registry.findById).not.toHaveBeenCalled();
    expect(registry.findMembership).not.toHaveBeenCalled();
  });
});
