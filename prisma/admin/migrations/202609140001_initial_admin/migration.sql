-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "gado_admin";

-- CreateEnum
CREATE TYPE "gado_admin"."OrganizacaoStatus" AS ENUM ('TRIAL', 'ATIVO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "gado_admin"."AssinaturaStatus" AS ENUM ('ATIVA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "gado_admin"."PagamentoStatus" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "gado_admin"."TenantRegistryStatus" AS ENUM ('PROVISIONANDO', 'ATIVO', 'BLOQUEADO', 'REMOVIDO');

-- CreateEnum
CREATE TYPE "gado_admin"."AdminRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "gado_admin"."AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "gado_admin"."RoleOrganizacao" AS ENUM ('PROPRIETARIO', 'CONVIDADO');

-- CreateEnum
CREATE TYPE "gado_admin"."StatusAcesso" AS ENUM ('PENDENTE', 'ATIVO', 'RECUSADO', 'REVOGADO', 'SOLICITADO');

-- CreateEnum
CREATE TYPE "gado_admin"."StatusConvite" AS ENUM ('PENDENTE', 'ACEITO', 'EXPIRADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "gado_admin"."organizacoes" (
    "id" UUID NOT NULL,
    "razaoSocial" VARCHAR(200) NOT NULL,
    "nomeFantasia" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(18),
    "email" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20),
    "subdomain" VARCHAR(63) NOT NULL,
    "schemaName" VARCHAR(63) NOT NULL,
    "status" "gado_admin"."OrganizacaoStatus" NOT NULL DEFAULT 'TRIAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."planos" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "maxUsuarios" INTEGER NOT NULL,
    "maxFazendas" INTEGER NOT NULL DEFAULT 1,
    "precoMensal" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."assinaturas" (
    "id" UUID NOT NULL,
    "organizacaoId" UUID NOT NULL,
    "planoId" UUID NOT NULL,
    "status" "gado_admin"."AssinaturaStatus" NOT NULL DEFAULT 'ATIVA',
    "dataInicio" DATE NOT NULL,
    "dataVencimento" DATE NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "gracePeriodDias" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."pagamentos" (
    "id" UUID NOT NULL,
    "assinaturaId" UUID NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "competencia" VARCHAR(7) NOT NULL,
    "status" "gado_admin"."PagamentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" DATE,
    "observacao" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."tenant_registry" (
    "id" UUID NOT NULL,
    "organizacaoId" UUID NOT NULL,
    "subdomain" VARCHAR(63) NOT NULL,
    "schemaName" VARCHAR(63) NOT NULL,
    "status" "gado_admin"."TenantRegistryStatus" NOT NULL DEFAULT 'PROVISIONANDO',
    "provisionedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."admin_users" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senhaHash" VARCHAR(255) NOT NULL,
    "role" "gado_admin"."AdminRole" NOT NULL DEFAULT 'SUPPORT',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."usuarios_globais" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senhaHash" VARCHAR(255),
    "googleId" VARCHAR(255),
    "fotoUrl" VARCHAR(500),
    "authProvider" "gado_admin"."AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_globais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."acesso_organizacoes" (
    "id" UUID NOT NULL,
    "usuarioGlobalId" UUID NOT NULL,
    "organizacaoId" UUID NOT NULL,
    "role" "gado_admin"."RoleOrganizacao" NOT NULL DEFAULT 'CONVIDADO',
    "status" "gado_admin"."StatusAcesso" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "acesso_organizacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."convites" (
    "id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "organizacaoId" UUID NOT NULL,
    "convidadoPorId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "role" "gado_admin"."RoleOrganizacao" NOT NULL DEFAULT 'CONVIDADO',
    "status" "gado_admin"."StatusConvite" NOT NULL DEFAULT 'PENDENTE',
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_cnpj_key" ON "gado_admin"."organizacoes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_subdomain_key" ON "gado_admin"."organizacoes"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_schemaName_key" ON "gado_admin"."organizacoes"("schemaName");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_registry_organizacaoId_key" ON "gado_admin"."tenant_registry"("organizacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_registry_subdomain_key" ON "gado_admin"."tenant_registry"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_registry_schemaName_key" ON "gado_admin"."tenant_registry"("schemaName");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "gado_admin"."admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_globais_email_key" ON "gado_admin"."usuarios_globais"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_globais_googleId_key" ON "gado_admin"."usuarios_globais"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "acesso_organizacoes_usuarioGlobalId_organizacaoId_key" ON "gado_admin"."acesso_organizacoes"("usuarioGlobalId", "organizacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "convites_token_key" ON "gado_admin"."convites"("token");

-- AddForeignKey
ALTER TABLE "gado_admin"."assinaturas" ADD CONSTRAINT "assinaturas_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."assinaturas" ADD CONSTRAINT "assinaturas_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "gado_admin"."planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."pagamentos" ADD CONSTRAINT "pagamentos_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "gado_admin"."assinaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."tenant_registry" ADD CONSTRAINT "tenant_registry_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."acesso_organizacoes" ADD CONSTRAINT "acesso_organizacoes_usuarioGlobalId_fkey" FOREIGN KEY ("usuarioGlobalId") REFERENCES "gado_admin"."usuarios_globais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."acesso_organizacoes" ADD CONSTRAINT "acesso_organizacoes_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."convites" ADD CONSTRAINT "convites_organizacaoId_fkey" FOREIGN KEY ("organizacaoId") REFERENCES "gado_admin"."organizacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."convites" ADD CONSTRAINT "convites_convidadoPorId_fkey" FOREIGN KEY ("convidadoPorId") REFERENCES "gado_admin"."usuarios_globais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
