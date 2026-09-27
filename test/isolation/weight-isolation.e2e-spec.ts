import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../src/common/context';
import { ManageWeightsUseCase } from '../../src/metrics/weights/application/use-cases/manage-weights.use-case';
import { PrismaWeightRepository } from '../../src/metrics/weights/infrastructure/prisma-weight.repository';
import { TenantSchemaName } from '../../src/tenant/domain/tenant-schema-name';
import { TenantPrismaClientFactory } from '../../src/tenant/infrastructure/tenant-prisma-client.factory';
import { TenantPrismaService } from '../../src/tenant/tenant-prisma.service';
import { MigrateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { PostgresTenantMigrationRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository';
import { TenantMigrationLoader } from '../../src/tenant-provisioning/infrastructure/tenant-migration.loader';
import {
  assertDisposableDatabase,
  disposableTenantSchema,
  dropTenantSchema,
  requireTestDatabaseUrl,
} from '../migrations/database-test-harness';

jest.setTimeout(60_000);

const contextFor = (
  schemaName: string,
  farmId: number,
): ExecutionContextData => ({
  requestId: `weight-isolation-${farmId}`,
  traceId: `weight-isolation-trace-${farmId}`,
  contextType: 'tenant',
  startedAt: Date.now(),
  tenantId: 'weight-isolation-tenant',
  organizationId: 'weight-isolation-organization',
  schemaName,
  globalUserId: `${farmId}`.padStart(8, '0') + '-1111-4111-8111-111111111111',
  localUserId: farmId,
  farmId,
  accessibleFarmIds: [farmId],
  permissions: ['pesagens:ler', 'pesagens:criar', 'pesagens:gerenciar'],
});

describe('weight persistence isolation under concurrency', () => {
  const databaseUrl = requireTestDatabaseUrl();
  const schemaName = disposableTenantSchema();
  const schema = TenantSchemaName.parse(schemaName);
  const pool = new Pool({ connectionString: databaseUrl, max: 3 });
  const context = new ExecutionContextStore();
  const factory = new TenantPrismaClientFactory(
    new ConfigService({ DATABASE_URL: databaseUrl }),
  );
  const tenantPrisma = new TenantPrismaService(context, factory);
  const useCase = new ManageWeightsUseCase(
    new PrismaWeightRepository(tenantPrisma),
    context,
    () => new Date('2026-09-27T12:00:00.000Z'),
  );
  let farmTenWeightId = 0;
  let farmTwentyWeightId = 0;

  beforeAll(async () => {
    await assertDisposableDatabase(pool);
    const migration = new MigrateTenantSchemaUseCase(
      context,
      new PostgresTenantMigrationRepository(pool),
      new TenantMigrationLoader(),
    );
    await context.run(
      {
        ...contextFor(schemaName, 10),
        contextType: 'job',
        permissions: ['tenant.migrate'],
      },
      () => migration.execute(),
    );

    const client = factory.create(schema);
    await client.fazenda.createMany({
      data: [
        { id: 10, nome: 'Fazenda Dez' },
        { id: 20, nome: 'Fazenda Vinte' },
      ],
    });
    await client.usuario.createMany({
      data: [
        { id: 10, nome: 'Usuário Dez', email: 'dez@example.test' },
        { id: 20, nome: 'Usuário Vinte', email: 'vinte@example.test' },
      ],
    });
    await client.raca.create({ data: { id: 1, descricao: 'Nelore' } });
    await client.lote.createMany({
      data: [
        { id: 11, fazendaId: 10, descricao: 'Lote Dez' },
        { id: 21, fazendaId: 20, descricao: 'Lote Vinte' },
      ],
    });
    await client.pasto.createMany({
      data: [
        { id: 12, fazendaId: 10, descricao: 'Pasto Dez' },
        { id: 22, fazendaId: 20, descricao: 'Pasto Vinte' },
      ],
    });
    await client.animal.createMany({
      data: [
        {
          id: 30,
          fazendaId: 10,
          loteId: 11,
          racaId: 1,
          pastoId: 12,
          tipoEntrada: 'NASCIMENTO',
          dataEntrada: new Date('2026-01-01T00:00:00.000Z'),
        },
        {
          id: 40,
          fazendaId: 20,
          loteId: 21,
          racaId: 1,
          pastoId: 22,
          tipoEntrada: 'NASCIMENTO',
          dataEntrada: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    });
  });

  afterAll(async () => {
    await factory.disposeAll();
    await dropTenantSchema(pool, schemaName);
    await pool.end();
  });

  it('registers simultaneously without crossing list or detail scope', async () => {
    const [farmTen, farmTwenty] = await Promise.all([
      context.run(contextFor(schemaName, 10), () =>
        useCase.register({
          animalId: 30,
          weight: 450,
          measuredAt: '2026-09-20',
        }),
      ),
      context.run(contextFor(schemaName, 20), () =>
        useCase.register({
          animalId: 40,
          weight: 550,
          measuredAt: '2026-09-20',
        }),
      ),
    ]);
    farmTenWeightId = farmTen.id;
    farmTwentyWeightId = farmTwenty.id;

    const [listTen, listTwenty] = await Promise.all([
      context.run(contextFor(schemaName, 10), () =>
        useCase.list({ page: 1, limit: 20 }),
      ),
      context.run(contextFor(schemaName, 20), () =>
        useCase.list({ page: 1, limit: 20 }),
      ),
    ]);
    expect(listTen.data).toEqual([
      expect.objectContaining({ id: farmTenWeightId, farmId: 10 }),
    ]);
    expect(listTwenty.data).toEqual([
      expect.objectContaining({ id: farmTwentyWeightId, farmId: 20 }),
    ]);
    await expect(
      context.run(contextFor(schemaName, 20), () =>
        useCase.get({ id: farmTenWeightId }),
      ),
    ).rejects.toMatchObject({ code: 'resourceNotFound' });
  });

  it('corrects both farms concurrently and keeps revisions and current weights coherent', async () => {
    const [correctedTen, correctedTwenty] = await Promise.all([
      context.run(contextFor(schemaName, 10), () =>
        useCase.correct({
          id: farmTenWeightId,
          weight: 451,
          measuredAt: '2026-09-20',
          correctionReason: 'Conferência dez',
        }),
      ),
      context.run(contextFor(schemaName, 20), () =>
        useCase.correct({
          id: farmTwentyWeightId,
          weight: 551,
          measuredAt: '2026-09-20',
          correctionReason: 'Conferência vinte',
        }),
      ),
    ]);

    const client = factory.create(schema);
    const [animalTen, animalTwenty] = await Promise.all([
      client.animal.findUniqueOrThrow({ where: { id: 30 } }),
      client.animal.findUniqueOrThrow({ where: { id: 40 } }),
    ]);
    expect(Number(animalTen.pesoAtual)).toBe(451);
    expect(Number(animalTwenty.pesoAtual)).toBe(551);
    await expect(
      context.run(contextFor(schemaName, 10), () =>
        useCase.get({ id: farmTenWeightId }),
      ),
    ).resolves.toMatchObject({ active: false });
    await expect(
      context.run(contextFor(schemaName, 10), () =>
        useCase.get({ id: correctedTen.id }),
      ),
    ).resolves.toMatchObject({
      active: true,
      correctsMeasurementId: farmTenWeightId,
    });
    await expect(
      context.run(contextFor(schemaName, 10), () =>
        useCase.get({ id: correctedTwenty.id }),
      ),
    ).rejects.toMatchObject({ code: 'resourceNotFound' });
  });
});
