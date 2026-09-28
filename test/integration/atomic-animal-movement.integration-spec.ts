import { randomBytes, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../src/common/context';
import { MoveAnimalUseCase } from '../../src/handling/movements/application/use-cases/move-animal.use-case';
import { PrismaMovementUnitOfWork } from '../../src/handling/movements/infrastructure/prisma-movement.unit-of-work';
import { TenantSchemaName } from '../../src/tenant/domain/tenant-schema-name';
import { TenantPrismaClientFactory } from '../../src/tenant/infrastructure/tenant-prisma-client.factory';
import { TenantPrismaService } from '../../src/tenant/tenant-prisma.service';
import { CreateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/create-tenant-schema.use-case';
import { MigrateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { PostgresTenantMigrationRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository';
import { PostgresTenantSchemaLifecycleRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-schema-lifecycle.repository';
import { TenantMigrationLoader } from '../../src/tenant-provisioning/infrastructure/tenant-migration.loader';

jest.setTimeout(180_000);

describe('atomic animal movement persistence', () => {
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
  const identity: ExecutionContextData = {
    requestId: randomUUID(),
    traceId: randomUUID(),
    contextType: 'tenant',
    startedAt: Date.now(),
    tenantId: randomUUID(),
    organizationId: randomUUID(),
    schemaName: schema.value,
    globalUserId: randomUUID(),
    accessibleFarmIds: [],
    permissions: [],
  };

  beforeAll(async () => {
    const database = await pool.query<{ name: string }>(
      'SELECT current_database() AS name',
    );
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

  it('allows only one concurrent move from the same persisted origin', async () => {
    const client = factory.create(schema);
    const farm = await client.fazenda.create({ data: { nome: 'Fazenda A' } });
    const user = await client.usuario.create({
      data: {
        nome: 'Operador',
        email: `${randomUUID()}@example.test`,
        globalUserId: identity.globalUserId,
      },
    });
    const breed = await client.raca.create({ data: { descricao: 'Nelore' } });
    const batch = await client.lote.create({
      data: { fazendaId: farm.id, descricao: 'Lote' },
    });
    const [origin, destinationA, destinationB] = await Promise.all([
      client.pasto.create({
        data: { fazendaId: farm.id, descricao: 'Origem' },
      }),
      client.pasto.create({
        data: { fazendaId: farm.id, descricao: 'Destino A' },
      }),
      client.pasto.create({
        data: { fazendaId: farm.id, descricao: 'Destino B' },
      }),
    ]);
    const animal = await client.animal.create({
      data: {
        fazendaId: farm.id,
        loteId: batch.id,
        racaId: breed.id,
        pastoId: origin.id,
      },
    });
    const operational: ExecutionContextData = {
      ...identity,
      localUserId: user.id,
      farmId: farm.id,
      accessibleFarmIds: [farm.id],
      permissions: ['movimentacoes:criar', 'movimentacoes:ler'],
    };
    const unitOfWork = new PrismaMovementUnitOfWork(
      new TenantPrismaService(context, factory),
    );
    const useCase = new MoveAnimalUseCase(unitOfWork, context);

    const outcomes = await context.run(operational, () =>
      Promise.allSettled([
        useCase.toPasture({
          animalId: animal.id,
          destinationPastureId: destinationA.id,
          movementDate: '2026-09-28',
        }),
        useCase.toPasture({
          animalId: animal.id,
          destinationPastureId: destinationB.id,
          movementDate: '2026-09-28',
        }),
      ]),
    );

    expect(
      outcomes.filter(({ status }) => status === 'fulfilled'),
    ).toHaveLength(1);
    expect(outcomes.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    );
    const persistedAnimal = await client.animal.findUniqueOrThrow({
      where: { id: animal.id },
      select: { pastoId: true },
    });
    const history = await client.movimentoPasto.findMany({
      where: { animalId: animal.id },
      select: { pastoOrigemId: true, pastoDestinoId: true },
    });
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({
      pastoOrigemId: origin.id,
      pastoDestinoId: persistedAnimal.pastoId,
    });
  });
});
