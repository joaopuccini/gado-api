SET LOCAL search_path = "__tenant__";

-- Keep the public TypeScript contract in camelCase while normalizing the
-- tenant persistence model without dropping or recreating populated columns.
ALTER TABLE "permissoes" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "permissoes" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "perfis" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "perfis" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "perfil_permissao" RENAME COLUMN "perfilId" TO "perfil_id";
ALTER TABLE "perfil_permissao" RENAME COLUMN "permissaoId" TO "permissao_id";
ALTER TABLE "perfil_permissao" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "usuario_permissao" RENAME COLUMN "usuarioId" TO "usuario_id";
ALTER TABLE "usuario_permissao" RENAME COLUMN "permissaoId" TO "permissao_id";
ALTER TABLE "usuario_permissao" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "usuarios" RENAME COLUMN "senhaHash" TO "senha_hash";
ALTER TABLE "usuarios" RENAME COLUMN "perfilId" TO "perfil_id";
ALTER TABLE "usuarios" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "usuarios" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "usuario_fazenda" RENAME COLUMN "usuarioId" TO "usuario_id";
ALTER TABLE "usuario_fazenda" RENAME COLUMN "fazendaId" TO "fazenda_id";
ALTER TABLE "usuario_fazenda" RENAME COLUMN "createdAt" TO "created_at";

-- Align database object names with their normalized physical columns.
ALTER INDEX "perfil_permissao_perfilId_permissaoId_key"
  RENAME TO "perfil_permissao_perfil_id_permissao_id_key";
ALTER INDEX "usuario_permissao_usuarioId_permissaoId_key"
  RENAME TO "usuario_permissao_usuario_id_permissao_id_key";
ALTER INDEX "usuario_fazenda_usuarioId_fazendaId_key"
  RENAME TO "usuario_fazenda_usuario_id_fazenda_id_key";

ALTER TABLE "perfil_permissao"
  RENAME CONSTRAINT "perfil_permissao_perfilId_fkey"
  TO "perfil_permissao_perfil_id_fkey";
ALTER TABLE "perfil_permissao"
  RENAME CONSTRAINT "perfil_permissao_permissaoId_fkey"
  TO "perfil_permissao_permissao_id_fkey";
ALTER TABLE "usuario_permissao"
  RENAME CONSTRAINT "usuario_permissao_usuarioId_fkey"
  TO "usuario_permissao_usuario_id_fkey";
ALTER TABLE "usuario_permissao"
  RENAME CONSTRAINT "usuario_permissao_permissaoId_fkey"
  TO "usuario_permissao_permissao_id_fkey";
ALTER TABLE "usuarios"
  RENAME CONSTRAINT "usuarios_perfilId_fkey"
  TO "usuarios_perfil_id_fkey";
ALTER TABLE "usuario_fazenda"
  RENAME CONSTRAINT "usuario_fazenda_usuarioId_fkey"
  TO "usuario_fazenda_usuario_id_fkey";
ALTER TABLE "usuario_fazenda"
  RENAME CONSTRAINT "usuario_fazenda_fazendaId_fkey"
  TO "usuario_fazenda_fazenda_id_fkey";
