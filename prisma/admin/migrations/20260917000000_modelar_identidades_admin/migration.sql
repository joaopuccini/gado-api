-- DropForeignKey
ALTER TABLE "gado_admin"."acesso_organizacoes" DROP CONSTRAINT "acesso_organizacoes_organizacaoId_fkey";

-- DropForeignKey
ALTER TABLE "gado_admin"."acesso_organizacoes" DROP CONSTRAINT "acesso_organizacoes_usuarioGlobalId_fkey";

-- DropForeignKey
ALTER TABLE "gado_admin"."assinaturas" DROP CONSTRAINT "assinaturas_organizacaoId_fkey";

-- DropForeignKey
ALTER TABLE "gado_admin"."assinaturas" DROP CONSTRAINT "assinaturas_planoId_fkey";

-- DropForeignKey
ALTER TABLE "gado_admin"."convites" DROP CONSTRAINT "convites_convidadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "gado_admin"."convites" DROP CONSTRAINT "convites_organizacaoId_fkey";

-- DropForeignKey
ALTER TABLE "gado_admin"."pagamentos" DROP CONSTRAINT "pagamentos_assinaturaId_fkey";

-- DropForeignKey
ALTER TABLE "gado_admin"."tenant_registry" DROP CONSTRAINT "tenant_registry_organizacaoId_fkey";

-- DropIndex
DROP INDEX "gado_admin"."acesso_organizacoes_usuarioGlobalId_organizacaoId_key";

-- DropIndex
DROP INDEX "gado_admin"."organizacoes_schemaName_key";

-- DropIndex
DROP INDEX "gado_admin"."tenant_registry_organizacaoId_key";

-- DropIndex
DROP INDEX "gado_admin"."tenant_registry_schemaName_key";

-- DropIndex
DROP INDEX "gado_admin"."usuarios_globais_googleId_key";

-- AlterTable
ALTER TABLE "gado_admin"."acesso_organizacoes" DROP COLUMN "createdAt",
DROP COLUMN "organizacaoId",
DROP COLUMN "updatedAt",
DROP COLUMN "usuarioGlobalId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "organizacao_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "usuario_global_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."admin_users" DROP COLUMN "createdAt",
DROP COLUMN "senhaHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senha_hash" VARCHAR(255) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."assinaturas" DROP COLUMN "createdAt",
DROP COLUMN "dataInicio",
DROP COLUMN "dataVencimento",
DROP COLUMN "diaVencimento",
DROP COLUMN "gracePeriodDias",
DROP COLUMN "organizacaoId",
DROP COLUMN "planoId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data_inicio" DATE NOT NULL,
ADD COLUMN     "data_vencimento" DATE NOT NULL,
ADD COLUMN     "dia_vencimento" INTEGER NOT NULL,
ADD COLUMN     "grace_period_dias" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "organizacao_id" UUID NOT NULL,
ADD COLUMN     "plano_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."convites" DROP COLUMN "convidadoPorId",
DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "organizacaoId",
ADD COLUMN     "convidado_por_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "organizacao_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."organizacoes" DROP COLUMN "createdAt",
DROP COLUMN "nomeFantasia",
DROP COLUMN "razaoSocial",
DROP COLUMN "schemaName",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nome_fantasia" VARCHAR(200) NOT NULL,
ADD COLUMN     "razao_social" VARCHAR(200) NOT NULL,
ADD COLUMN     "schema_name" VARCHAR(63) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."pagamentos" DROP COLUMN "assinaturaId",
DROP COLUMN "createdAt",
DROP COLUMN "dataPagamento",
DROP COLUMN "updatedAt",
ADD COLUMN     "assinatura_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data_pagamento" DATE,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."planos" DROP COLUMN "createdAt",
DROP COLUMN "maxFazendas",
DROP COLUMN "maxUsuarios",
DROP COLUMN "precoMensal",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "max_fazendas" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "max_usuarios" INTEGER NOT NULL,
ADD COLUMN     "preco_mensal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."tenant_registry" DROP COLUMN "createdAt",
DROP COLUMN "organizacaoId",
DROP COLUMN "provisionedAt",
DROP COLUMN "schemaName",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "organizacao_id" UUID NOT NULL,
ADD COLUMN     "provisioned_at" TIMESTAMPTZ(6),
ADD COLUMN     "schema_name" VARCHAR(63) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "gado_admin"."usuarios_globais" DROP COLUMN "authProvider",
DROP COLUMN "createdAt",
DROP COLUMN "fotoUrl",
DROP COLUMN "googleId",
DROP COLUMN "senhaHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "auth_provider" "gado_admin"."AuthProvider" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "foto_url" VARCHAR(500),
ADD COLUMN     "google_id" VARCHAR(255),
ADD COLUMN     "senha_hash" VARCHAR(255),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "acesso_organizacoes_usuario_global_id_organizacao_id_key" ON "gado_admin"."acesso_organizacoes"("usuario_global_id", "organizacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_schema_name_key" ON "gado_admin"."organizacoes"("schema_name");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_registry_organizacao_id_key" ON "gado_admin"."tenant_registry"("organizacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_registry_schema_name_key" ON "gado_admin"."tenant_registry"("schema_name");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_globais_google_id_key" ON "gado_admin"."usuarios_globais"("google_id");

-- AddForeignKey
ALTER TABLE "gado_admin"."assinaturas" ADD CONSTRAINT "assinaturas_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."assinaturas" ADD CONSTRAINT "assinaturas_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "gado_admin"."planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."pagamentos" ADD CONSTRAINT "pagamentos_assinatura_id_fkey" FOREIGN KEY ("assinatura_id") REFERENCES "gado_admin"."assinaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."tenant_registry" ADD CONSTRAINT "tenant_registry_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."acesso_organizacoes" ADD CONSTRAINT "acesso_organizacoes_usuario_global_id_fkey" FOREIGN KEY ("usuario_global_id") REFERENCES "gado_admin"."usuarios_globais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."acesso_organizacoes" ADD CONSTRAINT "acesso_organizacoes_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."convites" ADD CONSTRAINT "convites_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."convites" ADD CONSTRAINT "convites_convidado_por_id_fkey" FOREIGN KEY ("convidado_por_id") REFERENCES "gado_admin"."usuarios_globais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

