import { Pool } from 'pg';
import { ExecutionContextStore } from '../../src/common/context';
import { TenantSchemaName } from '../../src/tenant/domain/tenant-schema-name';
import { MigrateTenantSchemaUseCase } from '../../src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case';
import { PostgresTenantMigrationRepository } from '../../src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository';
import { TenantMigrationLoader } from '../../src/tenant-provisioning/infrastructure/tenant-migration.loader';
import {
  TENANT_CURRENT_VERSION,
  assertDisposableDatabase,
  disposableTenantSchema,
  dropTenantSchema,
  requireTestDatabaseUrl,
} from './database-test-harness';

jest.setTimeout(60_000);

describe('tenant migrations on an empty schema', () => {
  const databaseUrl = requireTestDatabaseUrl();
  const schemaName = disposableTenantSchema();
  const schema = TenantSchemaName.parse(schemaName);
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const context = new ExecutionContextStore();
  const repository = new PostgresTenantMigrationRepository(pool);
  const loader = new TenantMigrationLoader();
  const useCase = new MigrateTenantSchemaUseCase(context, repository, loader);

  beforeAll(async () => {
    await assertDisposableDatabase(pool);
  });

  afterAll(async () => {
    await dropTenantSchema(pool, schemaName);
    await pool.end();
  });

  it('creates normalized tables, constraints, seeds and checksummed versions', async () => {
    const result = await context.run(
      {
        requestId: 'tenant-migration-request',
        traceId: 'tenant-migration-trace',
        contextType: 'job',
        startedAt: Date.now(),
        tenantId: 'migration-tenant',
        organizationId: 'migration-organization',
        schemaName,
        globalUserId: 'migration-worker',
        accessibleFarmIds: [],
        permissions: ['tenant.migrate'],
      },
      () => useCase.execute(),
    );

    expect(result).toEqual({
      fromVersion: null,
      toVersion: TENANT_CURRENT_VERSION,
    });

    const tables = await pool.query<{ tableName: string }>(
      `
      SELECT table_name AS "tableName"
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name
    `,
      [schemaName],
    );
    expect(tables.rows.map(({ tableName }) => tableName)).toEqual(
      expect.arrayContaining([
        '_gado_tenant_migrations',
        'animais',
        'fazendas',
        'perfis',
        'permissoes',
        'usuarios',
      ]),
    );

    const foreignKeys = await pool.query<{ total: number }>(
      `
      SELECT count(*)::int AS total
      FROM pg_constraint constraint_record
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = constraint_record.connamespace
      WHERE namespace_record.nspname = $1
        AND constraint_record.contype = 'f'
    `,
      [schemaName],
    );
    expect(foreignKeys.rows[0]?.total).toBeGreaterThan(20);

    const seedCounts = await pool.query<{
      permissions: number;
      profiles: number;
    }>(`
      SELECT
        (SELECT count(*)::int FROM "${schemaName}"."permissoes") AS permissions,
        (SELECT count(*)::int FROM "${schemaName}"."perfis") AS profiles
    `);
    expect(seedCounts.rows[0]?.permissions).toBeGreaterThan(0);
    expect(seedCounts.rows[0]?.profiles).toBeGreaterThan(0);

    const expectedMigrations = await loader.load();
    const applied = await repository.appliedVersions(schema);
    expect([...applied.entries()]).toEqual(
      expectedMigrations.map(({ version, checksum }) => [version, checksum]),
    );

    const hierarchyObjects = await pool.query<{ name: string }>(
      `
      SELECT indexname AS name
      FROM pg_indexes
      WHERE schemaname = $1
        AND indexname IN (
          'fazendas_parent_id_ativo_idx',
          'usuario_fazenda_usuario_id_ativo_fazenda_id_idx'
        )
      UNION ALL
      SELECT constraint_name AS name
      FROM information_schema.table_constraints
      WHERE constraint_schema = $1
        AND constraint_name = 'fazendas_parent_not_self'
      ORDER BY name
      `,
      [schemaName],
    );
    expect(hierarchyObjects.rows.map(({ name }) => name)).toEqual([
      'fazendas_parent_id_ativo_idx',
      'fazendas_parent_not_self',
      'usuario_fazenda_usuario_id_ativo_fazenda_id_idx',
    ]);

    const weightAuditColumns = await pool.query<{ columnName: string }>(
      `
      SELECT column_name AS "columnName"
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = 'pesagens'
        AND column_name IN (
          'ativa',
          'corrige_pesagem_id',
          'motivo_correcao',
          'registrado_por_id'
        )
      ORDER BY column_name
      `,
      [schemaName],
    );
    expect(weightAuditColumns.rows.map(({ columnName }) => columnName)).toEqual(
      ['ativa', 'corrige_pesagem_id', 'motivo_correcao', 'registrado_por_id'],
    );

    const handlingColumns = await pool.query<{
      tableName: string;
      columnName: string;
    }>(
      `
      SELECT table_name AS "tableName", column_name AS "columnName"
      FROM information_schema.columns
      WHERE table_schema = $1
        AND (
          (table_name = 'movimentos_pasto' AND column_name = 'registrado_por_id')
          OR (table_name = 'movimentos_lote' AND column_name = 'registrado_por_id')
          OR (table_name = 'transferencia_animais' AND column_name = 'registrado_por_id')
          OR (table_name = 'manejo_reproducao' AND column_name IN (
            'tipo_evento', 'status_ciclo', 'data_evento', 'ciclo_id', 'registrado_por_id'
          ))
          OR (table_name = 'vacinacoes' AND column_name IN (
            'protocolo', 'dose', 'unidade_dose', 'proxima_dose', 'registrado_por_id', 'ativa'
          ))
          OR (table_name = 'fotos' AND column_name IN (
            'object_key', 'mime_type', 'tamanho_bytes', 'checksum_sha256',
            'status_storage', 'registrado_por_id'
          ))
        )
      ORDER BY table_name, column_name
      `,
      [schemaName],
    );
    expect(handlingColumns.rows).toEqual([
      { tableName: 'fotos', columnName: 'checksum_sha256' },
      { tableName: 'fotos', columnName: 'mime_type' },
      { tableName: 'fotos', columnName: 'object_key' },
      { tableName: 'fotos', columnName: 'registrado_por_id' },
      { tableName: 'fotos', columnName: 'status_storage' },
      { tableName: 'fotos', columnName: 'tamanho_bytes' },
      { tableName: 'manejo_reproducao', columnName: 'ciclo_id' },
      { tableName: 'manejo_reproducao', columnName: 'data_evento' },
      { tableName: 'manejo_reproducao', columnName: 'registrado_por_id' },
      { tableName: 'manejo_reproducao', columnName: 'status_ciclo' },
      { tableName: 'manejo_reproducao', columnName: 'tipo_evento' },
      { tableName: 'movimentos_lote', columnName: 'registrado_por_id' },
      { tableName: 'movimentos_pasto', columnName: 'registrado_por_id' },
      { tableName: 'transferencia_animais', columnName: 'registrado_por_id' },
      { tableName: 'vacinacoes', columnName: 'ativa' },
      { tableName: 'vacinacoes', columnName: 'dose' },
      { tableName: 'vacinacoes', columnName: 'protocolo' },
      { tableName: 'vacinacoes', columnName: 'proxima_dose' },
      { tableName: 'vacinacoes', columnName: 'registrado_por_id' },
      { tableName: 'vacinacoes', columnName: 'unidade_dose' },
    ]);

    const handlingConstraints = await pool.query<{ name: string }>(
      `
      SELECT constraint_record.conname AS name
      FROM pg_constraint constraint_record
      JOIN pg_namespace namespace_record
        ON namespace_record.oid = constraint_record.connamespace
      WHERE namespace_record.nspname = $1
        AND constraint_record.conname IN (
          'pastos_geojson_polygon_valid',
          'pastos_tamanho_hectares_positive',
          'movimentos_pasto_distinct_locations',
          'movimentos_lote_distinct_locations',
          'transferencia_animais_distinct_farms',
          'vacinacoes_dose_positive',
          'fotos_tamanho_bytes_positive'
        )
      ORDER BY constraint_record.conname
      `,
      [schemaName],
    );
    expect(handlingConstraints.rows.map(({ name }) => name)).toEqual([
      'fotos_tamanho_bytes_positive',
      'movimentos_lote_distinct_locations',
      'movimentos_pasto_distinct_locations',
      'pastos_geojson_polygon_valid',
      'pastos_tamanho_hectares_positive',
      'transferencia_animais_distinct_farms',
      'vacinacoes_dose_positive',
    ]);

    const handlingIndexes = await pool.query<{ name: string }>(
      `
      SELECT indexname AS name
      FROM pg_indexes
      WHERE schemaname = $1
        AND indexname IN (
          'movimentos_pasto_fazenda_animal_data_id_idx',
          'movimentos_lote_fazenda_animal_data_id_idx',
          'transferencia_animais_origem_animal_data_id_idx',
          'manejo_reproducao_fazenda_vaca_data_id_idx',
          'vacinacoes_fazenda_animal_proxima_dose_idx',
          'fotos_fazenda_animal_created_at_idx'
        )
      ORDER BY indexname
      `,
      [schemaName],
    );
    expect(handlingIndexes.rows.map(({ name }) => name)).toEqual([
      'fotos_fazenda_animal_created_at_idx',
      'manejo_reproducao_fazenda_vaca_data_id_idx',
      'movimentos_lote_fazenda_animal_data_id_idx',
      'movimentos_pasto_fazenda_animal_data_id_idx',
      'transferencia_animais_origem_animal_data_id_idx',
      'vacinacoes_fazenda_animal_proxima_dose_idx',
    ]);
  });
});
