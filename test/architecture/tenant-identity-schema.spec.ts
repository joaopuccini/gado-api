import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readRepositoryFile = (path: string): string =>
  readFileSync(resolve(process.cwd(), path), 'utf8');

describe('tenant identity schema migration', () => {
  it('keeps the published tenant migration immutable', () => {
    const migration = readRepositoryFile(
      'prisma/tenant/migrations/202609140002_animal_ear_tag_lookup_index/migration.sql',
    );

    const canonicalMigration = migration.replaceAll('\r\n', '\n');

    expect(createHash('sha256').update(canonicalMigration).digest('hex')).toBe(
      'f1a05121e1ed27fcfe98685491a11e0068fd7db5517113e57b81375f8d72e693',
    );
  });

  it('maps operational identities to snake_case database columns', () => {
    const schema = readRepositoryFile('prisma/tenant/schema.prisma');

    expect(schema).toMatch(
      /model Usuario \{[\s\S]*senhaHash\s+String\s+@map\("senha_hash"\)[\s\S]*perfilId\s+Int\?\s+@map\("perfil_id"\)[\s\S]*createdAt\s+DateTime\s+@default\(now\(\)\)\s+@map\("created_at"\)[\s\S]*updatedAt\s+DateTime\s+@updatedAt\s+@map\("updated_at"\)[\s\S]*@@map\("usuarios"\)/,
    );
    expect(schema).toMatch(
      /model UsuarioFazenda \{[\s\S]*usuarioId\s+Int\s+@map\("usuario_id"\)[\s\S]*fazendaId\s+Int\s+@map\("fazenda_id"\)[\s\S]*createdAt\s+DateTime\s+@default\(now\(\)\)\s+@map\("created_at"\)[\s\S]*@@unique\(\[usuarioId, fazendaId\]\)[\s\S]*@@map\("usuario_fazenda"\)/,
    );
  });

  it('renames identity columns in a new data-preserving migration', () => {
    const migration = readRepositoryFile(
      'prisma/tenant/migrations/202609170001_modelar_identidades_tenant/migration.sql',
    );

    expect(migration).toContain('SET LOCAL search_path = "__tenant__";');
    expect(migration).toContain(
      'ALTER TABLE "usuarios" RENAME COLUMN "senhaHash" TO "senha_hash";',
    );
    expect(migration).toContain(
      'ALTER TABLE "usuarios" RENAME COLUMN "perfilId" TO "perfil_id";',
    );
    expect(migration).toContain(
      'ALTER TABLE "usuario_fazenda" RENAME COLUMN "usuarioId" TO "usuario_id";',
    );
    expect(migration).toContain(
      'ALTER TABLE "usuario_fazenda" RENAME COLUMN "fazendaId" TO "fazenda_id";',
    );
    expect(migration).not.toMatch(/DROP\s+COLUMN|ADD\s+COLUMN/i);
  });
});
