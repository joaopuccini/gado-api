import { randomBytes, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ExecutionContextStore, type ExecutionContextData } from '../../src/common/context';
import { GetFarmDashboardUseCase } from '../../src/metrics/dashboard/application/use-cases/get-farm-dashboard.use-case';
import { PrismaDashboardRepository } from '../../src/metrics/dashboard/infrastructure/prisma-dashboard.repository';
import { TenantSchemaName } from '../../src/tenant/domain/tenant-schema-name';
import { TenantPrismaClientFactory } from '../../src/tenant/infrastructure/tenant-prisma-client.factory';
import { TenantPrismaService } from '../../src/tenant/tenant-prisma.service';
import { CreateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/create-tenant-schema.use-case';
import { MigrateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { PostgresTenantMigrationRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository';
import { PostgresTenantSchemaLifecycleRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-schema-lifecycle.repository';
import { TenantMigrationLoader } from '../../src/tenant-provisioning/infrastructure/tenant-migration.loader';

jest.setTimeout(180_000);

describe('persisted metrics reconciliation', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error('TEST_DATABASE_URL is required');
  const schema = TenantSchemaName.parse(`tenant_${randomBytes(16).toString('hex')}`);
  const context = new ExecutionContextStore();
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const factory = new TenantPrismaClientFactory(new ConfigService({ DATABASE_URL: databaseUrl }));
  const lifecycle = new PostgresTenantSchemaLifecycleRepository(() => databaseUrl);
  const identity: ExecutionContextData = {
    requestId: randomUUID(), traceId: randomUUID(), contextType: 'tenant', startedAt: Date.now(),
    tenantId: randomUUID(), organizationId: randomUUID(), schemaName: schema.value,
    globalUserId: randomUUID(), accessibleFarmIds: [], permissions: [],
  };

  beforeAll(async () => {
    const database = await pool.query<{ name: string }>('SELECT current_database() AS name');
    expect(database.rows[0]?.name).toMatch(/^gado_wave00_test_[0-9a-f]{12}$/);
    await context.run(identity, async () => {
      await new CreateTenantSchemaUseCase(context, lifecycle).execute();
      await new MigrateTenantSchemaUseCase(
        context,
        new PostgresTenantMigrationRepository(pool),
        new TenantMigrationLoader(),
      ).execute();
    });
  });

  afterAll(async () => {
    await factory.disposeAll();
    await pool.query(`DROP SCHEMA IF EXISTS "${schema.value}" CASCADE`);
    await lifecycle.onModuleDestroy();
    await pool.end();
  });

  it('reconciles counts and kg/GMD within 0.001 while excluding inactive data', async () => {
    const client = factory.create(schema);
    const farm = await client.fazenda.create({ data: { nome: 'Fazenda Métricas' } });
    const breed = await client.raca.create({ data: { descricao: 'Nelore' } });
    const [batchOne, batchTwo, pastureOne, pastureTwo] = await Promise.all([
      client.lote.create({ data: { fazendaId: farm.id, descricao: 'Recria' } }),
      client.lote.create({ data: { fazendaId: farm.id, descricao: 'Engorda' } }),
      client.pasto.create({ data: { fazendaId: farm.id, descricao: 'Norte' } }),
      client.pasto.create({ data: { fazendaId: farm.id, descricao: 'Sul' } }),
    ]);
    const createAnimal = (data: { loteId: number; pastoId: number; pesoAtual: number | null; ativo?: boolean }) =>
      client.animal.create({ data: {
        fazendaId: farm.id, racaId: breed.id, loteId: data.loteId, pastoId: data.pastoId,
        pesoAtual: data.pesoAtual, dataEntrada: new Date('2025-01-01'), ativo: data.ativo ?? true,
      } });
    const [gaining, losing, unweighed, inactive] = await Promise.all([
      createAnimal({ loteId: batchOne.id, pastoId: pastureOne.id, pesoAtual: 440 }),
      createAnimal({ loteId: batchOne.id, pastoId: pastureTwo.id, pesoAtual: 300 }),
      createAnimal({ loteId: batchTwo.id, pastoId: pastureTwo.id, pesoAtual: null }),
      createAnimal({ loteId: batchTwo.id, pastoId: pastureTwo.id, pesoAtual: 2000, ativo: false }),
    ]);
    await client.pesagem.createMany({ data: [
      { fazendaId: farm.id, animalId: gaining.id, peso: 400, dataPesagem: new Date('2026-01-01') },
      { fazendaId: farm.id, animalId: gaining.id, peso: 440, dataPesagem: new Date('2026-02-10') },
      { fazendaId: farm.id, animalId: losing.id, peso: 320, dataPesagem: new Date('2026-09-01') },
      { fazendaId: farm.id, animalId: losing.id, peso: 300, dataPesagem: new Date('2026-09-21') },
      { fazendaId: farm.id, animalId: inactive.id, peso: 1000, dataPesagem: new Date('2026-01-01') },
      { fazendaId: farm.id, animalId: inactive.id, peso: 2000, dataPesagem: new Date('2026-01-02') },
    ] });
    const operational = { ...identity, localUserId: 1, farmId: farm.id, accessibleFarmIds: [farm.id] };
    const repository = new PrismaDashboardRepository(new TenantPrismaService(context, factory));
    const result = await context.run(operational, () =>
      new GetFarmDashboardUseCase(repository, context, () => new Date('2026-09-27T00:00:00Z')).execute(),
    );

    expect(result.activeAnimals).toBe(3);
    expect(result.averageWeight).toBeCloseTo(370, 3);
    expect(result.averageDailyGain).toBeCloseTo(0, 3);
    expect(result.monthlyEvolution).toEqual([
      { month: '2026-01', averageWeight: 400 },
      { month: '2026-02', averageWeight: 440 },
      { month: '2026-09', averageWeight: 310 },
    ]);
    expect(result.byBatch).toEqual([
      { id: batchOne.id, name: 'Recria', animalCount: 2, averageWeight: 370 },
      { id: batchTwo.id, name: 'Engorda', animalCount: 1, averageWeight: null },
    ]);
    expect(result.byPasture).toEqual([
      { id: pastureOne.id, name: 'Norte', animalCount: 1, averageWeight: 440 },
      { id: pastureTwo.id, name: 'Sul', animalCount: 2, averageWeight: 300 },
    ]);
    expect(result.alerts).toEqual([
      { type: 'STALE_WEIGHT', animalId: gaining.id, lastMeasuredAt: '2026-02-10' },
      { type: 'WEIGHT_LOSS', animalId: losing.id, lastMeasuredAt: '2026-09-21' },
      { type: 'NO_WEIGHT', animalId: unweighed.id, lastMeasuredAt: null },
    ]);
  });
});
