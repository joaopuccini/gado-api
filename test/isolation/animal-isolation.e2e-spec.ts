import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../src/common/context';
import { ManageAnimalsUseCase } from '../../src/herd/animals/application/use-cases/manage-animals.use-case';
import { PrismaAnimalRepository } from '../../src/herd/animals/infrastructure/prisma-animal.repository';
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
  requestId: `animal-isolation-${farmId}`,
  traceId: `animal-isolation-trace-${farmId}`,
  contextType: 'tenant',
  startedAt: Date.now(),
  tenantId: 'animal-isolation-tenant',
  organizationId: 'animal-isolation-organization',
  schemaName,
  globalUserId: '11111111-1111-4111-8111-111111111111',
  localUserId: farmId,
  farmId,
  accessibleFarmIds: [farmId],
  permissions: [
    'animais:ler',
    'animais:criar',
    'animais:editar',
    'animais:excluir',
  ],
});

describe('animal persistence isolation under concurrency', () => {
  const databaseUrl = requireTestDatabaseUrl();
  const schemaName = disposableTenantSchema();
  const schema = TenantSchemaName.parse(schemaName);
  const pool = new Pool({ connectionString: databaseUrl, max: 3 });
  const context = new ExecutionContextStore();
  const factory = new TenantPrismaClientFactory(
    new ConfigService({ DATABASE_URL: databaseUrl }),
  );
  const tenantPrisma = new TenantPrismaService(context, factory);
  const useCase = new ManageAnimalsUseCase(
    new PrismaAnimalRepository(tenantPrisma),
    context,
  );
  let farmTenAnimalId = 0;
  let farmTwentyAnimalId = 0;

  const create = (farmId: number, numeroBrinco: string) =>
    context.run(contextFor(schemaName, farmId), () =>
      useCase.create({
        loteId: farmId === 10 ? 11 : 21,
        racaId: 1,
        pastoId: farmId === 10 ? 12 : 22,
        numeroBrinco,
        sexo: 'FEMEA',
        tipoEntrada: 'NASCIMENTO',
        dataEntrada: '2026-09-27',
      }),
    );

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
  });

  afterAll(async () => {
    await factory.disposeAll();
    await dropTenantSchema(pool, schemaName);
    await pool.end();
  });

  it('allows the same normalized ear tag in different farms and conflicts once in the same farm', async () => {
    const [farmTen, farmTwenty] = await Promise.all([
      create(10, ' shared-001 '),
      create(20, 'SHARED-001'),
    ]);
    farmTenAnimalId = farmTen.id;
    farmTwentyAnimalId = farmTwenty.id;
    expect(farmTen).toMatchObject({
      fazendaId: 10,
      numeroBrinco: 'SHARED-001',
    });
    expect(farmTwenty).toMatchObject({
      fazendaId: 20,
      numeroBrinco: 'SHARED-001',
    });

    const sameFarm = await Promise.allSettled([
      create(10, 'COLLISION-001'),
      create(10, ' collision-001 '),
    ]);
    expect(
      sameFarm.filter(({ status }) => status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = sameFarm.find(({ status }) => status === 'rejected');
    expect(rejected).toMatchObject({
      status: 'rejected',
      reason: { code: 'earTagAlreadyExists' },
    });
  });

  it('never crosses farm scope for list, detail, edit or deactivate', async () => {
    const [farmTen, farmTwenty] = await Promise.all([
      context.run(contextFor(schemaName, 10), () =>
        useCase.list({ page: 1, limit: 20 }),
      ),
      context.run(contextFor(schemaName, 20), () =>
        useCase.list({ page: 1, limit: 20 }),
      ),
    ]);
    expect(farmTen.data.every(({ fazendaId }) => fazendaId === 10)).toBe(true);
    expect(farmTwenty.data).toEqual([
      expect.objectContaining({ id: farmTwentyAnimalId, fazendaId: 20 }),
    ]);

    await context.run(contextFor(schemaName, 20), async () => {
      await expect(useCase.get({ id: farmTenAnimalId })).rejects.toMatchObject({
        code: 'animalNotFound',
      });
      await expect(
        useCase.update({ id: farmTenAnimalId, pesoAtual: 450 }),
      ).rejects.toMatchObject({ code: 'animalNotFound' });
      await expect(
        useCase.deactivate({ id: farmTenAnimalId }),
      ).rejects.toMatchObject({ code: 'animalNotFound' });
    });

    await context.run(contextFor(schemaName, 10), async () => {
      await expect(useCase.get({ id: farmTenAnimalId })).resolves.toMatchObject(
        { ativo: true, pesoAtual: null },
      );
      await expect(
        useCase.update({ id: farmTenAnimalId, pesoAtual: 451 }),
      ).resolves.toMatchObject({ fazendaId: 10, pesoAtual: 451 });
      await expect(
        useCase.deactivate({ id: farmTenAnimalId }),
      ).resolves.toMatchObject({ fazendaId: 10, ativo: false });
      await expect(useCase.get({ id: farmTenAnimalId })).rejects.toMatchObject({
        code: 'animalNotFound',
      });
    });
  });
});
