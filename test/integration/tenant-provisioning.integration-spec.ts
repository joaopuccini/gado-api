import { randomBytes, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ExecutionContextStore } from '../../src/common/context';
import { TenantSchemaName } from '../../src/tenant/domain/tenant-schema-name';
import { TenantPrismaClientFactory } from '../../src/tenant/infrastructure/tenant-prisma-client.factory';
import { SeedProfilesService } from '../../src/tenant-provisioning/application/services/seed-profiles.service';
import { SyncPermissionsService } from '../../src/tenant-provisioning/application/services/sync-permissions.service';
import { CreateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/create-tenant-schema.use-case';
import { MigrateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { ProvisionTenantOrchestratorUseCase } from '../../src/tenant-provisioning/application/use-cases/provision-tenant-orchestrator.use-case';
import { ProvisionTenantUseCase } from '../../src/tenant-provisioning/application/use-cases/provision-tenant.use-case';
import { PrismaDefaultProfileRepository } from '../../src/tenant-provisioning/infrastructure/persistence/prisma/prisma-default-profile.repository';
import { PrismaPermissionCatalogRepository } from '../../src/tenant-provisioning/infrastructure/persistence/prisma/prisma-permission-catalog.repository';
import { PrismaTenantBootstrapRepository } from '../../src/tenant-provisioning/infrastructure/persistence/prisma/prisma-tenant-bootstrap.repository';
import { PostgresTenantMigrationRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository';
import { PostgresTenantSchemaLifecycleRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-schema-lifecycle.repository';
import { TenantMigrationLoader } from '../../src/tenant-provisioning/infrastructure/tenant-migration.loader';

jest.setTimeout(180_000);

describe('tenant provisioning integration', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error('TEST_DATABASE_URL is required');

  const schema = TenantSchemaName.parse(
    `tenant_${randomBytes(16).toString('hex')}`,
  );
  const context = new ExecutionContextStore();
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const factory = new TenantPrismaClientFactory(
    new ConfigService({ DATABASE_URL: databaseUrl }),
  );
  const lifecycle = new PostgresTenantSchemaLifecycleRepository(
    () => databaseUrl,
  );
  const createSchema = new CreateTenantSchemaUseCase(context, lifecycle);
  const migrateSchema = new MigrateTenantSchemaUseCase(
    context,
    new PostgresTenantMigrationRepository(pool),
    new TenantMigrationLoader(),
  );
  const syncPermissions = new SyncPermissionsService(
    new PrismaPermissionCatalogRepository(context, factory),
  );
  const seedProfiles = new SeedProfilesService(
    new PrismaDefaultProfileRepository(context, factory),
  );
  const bootstrapRepository = new PrismaTenantBootstrapRepository(
    context,
    factory,
  );
  const provisionTenant = new ProvisionTenantUseCase(bootstrapRepository);
  const orchestrator = new ProvisionTenantOrchestratorUseCase(
    context,
    createSchema,
    migrateSchema,
    syncPermissions,
    seedProfiles,
    provisionTenant,
  );
  const provisioningRunId = randomUUID();
  const globalUserId = randomUUID();
  const command = {
    tenantId: randomUUID(),
    organizationId: randomUUID(),
    schemaName: schema.value,
    globalUserId,
    bootstrap: {
      provisioningRunId,
      globalUserId,
      ownerName: 'Owner Integration',
      ownerEmail: 'owner.integration@example.com',
      passwordHash: 'stored-hash',
      farmName: 'Fazenda Principal',
    },
  };

  beforeAll(async () => {
    const database = await pool.query<{ name: string }>(
      'SELECT current_database() AS name',
    );
    expect(database.rows[0]?.name).toMatch(/^gado_wave00_test_[0-9a-f]{12}$/);
  });

  afterAll(async () => {
    await factory.disposeAll();
    await pool.query(`DROP SCHEMA IF EXISTS "${schema.value}" CASCADE`);
    await lifecycle.onModuleDestroy();
    await pool.end();
  });

  it('retries the complete flow without duplicating tenant resources', async () => {
    await orchestrator.execute(command);
    await orchestrator.execute(command);

    const client = factory.create(schema);
    const [users, farms, links, managedProfiles, permissions] =
      await Promise.all([
        client.usuario.findMany({ where: { globalUserId } }),
        client.fazenda.findMany({ where: { provisioningRunId } }),
        client.usuarioFazenda.findMany(),
        client.perfil.count({ where: { systemRole: { not: null } } }),
        client.permissao.count(),
      ]);

    expect(users).toHaveLength(1);
    expect(farms).toHaveLength(1);
    expect(links).toHaveLength(1);
    expect(managedProfiles).toBe(5);
    expect(permissions).toBe(33);
    expect(links[0]).toMatchObject({
      usuarioId: users[0].id,
      fazendaId: farms[0].id,
      role: 'DONO',
      ativo: true,
    });
  });
});
