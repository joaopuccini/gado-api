-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "__tenant__";
SET LOCAL search_path = "__tenant__";

-- CreateEnum
CREATE TYPE "SexoAnimal" AS ENUM ('MACHO', 'FEMEA');

-- CreateEnum
CREATE TYPE "StatusAnimal" AS ENUM ('ATIVO', 'VENDIDO', 'MORTO', 'TRANSFERIDO');

-- CreateEnum
CREATE TYPE "TipoEntrada" AS ENUM ('COMPRA_OLHO', 'COMPRA_KILO', 'NASCIMENTO', 'DOACAO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "TipoOperacaoCaixa" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "RoleFazenda" AS ENUM ('DONO', 'GESTOR', 'COLABORADOR', 'VETERINARIO', 'CONSULTOR');

-- CreateEnum
CREATE TYPE "CategoriaProduto" AS ENUM ('VACINA', 'MEDICAMENTO', 'RACAO', 'SAL', 'SEMENTE', 'COMBUSTIVEL', 'MAQUINARIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('RASCUNHO', 'APROVADO', 'RECEBIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoMedidor" AS ENUM ('HORIMETRO', 'HODOMETRO');

-- CreateTable
CREATE TABLE "permissoes" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "modulo" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(50),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_permissao" (
    "id" SERIAL NOT NULL,
    "perfilId" INTEGER NOT NULL,
    "permissaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_permissao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "permissaoId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "global_user_id" UUID,
    "nome" VARCHAR(200) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senhaHash" VARCHAR(255) NOT NULL,
    "celular" VARCHAR(20),
    "perfilId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fazendas" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "nome" VARCHAR(200) NOT NULL,
    "nome_proprietario" VARCHAR(200),
    "cpf_cnpj" VARCHAR(18),
    "celular" VARCHAR(20),
    "cep" VARCHAR(10),
    "endereco" VARCHAR(300),
    "bairro" VARCHAR(100),
    "cidade" VARCHAR(100),
    "estado" VARCHAR(2),
    "numero" VARCHAR(10),
    "observacao" TEXT,
    "geojson" JSONB,
    "tamanho_hectares" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "fazendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_fazenda" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "fazendaId" INTEGER NOT NULL,
    "role" "RoleFazenda" NOT NULL DEFAULT 'COLABORADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_fazenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "lote_id" INTEGER NOT NULL,
    "raca_id" INTEGER NOT NULL,
    "pasto_id" INTEGER NOT NULL,
    "cliente_id" INTEGER,
    "nome" VARCHAR(100),
    "numero_brinco" VARCHAR(50),
    "sexo" "SexoAnimal",
    "status" "StatusAnimal" NOT NULL DEFAULT 'ATIVO',
    "tipo_entrada" "TipoEntrada" NOT NULL DEFAULT 'COMPRA_OLHO',
    "nascimento" DATE,
    "data_entrada" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peso_entrada" DECIMAL(10,3) DEFAULT 0,
    "peso_atual" DECIMAL(10,3) DEFAULT 0,
    "preco_kilo" DECIMAL(10,2) DEFAULT 0,
    "valor_compra" DECIMAL(10,2) DEFAULT 0,
    "valor_custo_total" DECIMAL(10,2) DEFAULT 0,
    "matriz" BOOLEAN NOT NULL DEFAULT false,
    "castrado" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racas" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "racas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "descricao" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pastos" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "descricao" VARCHAR(100) NOT NULL,
    "geojson" JSONB,
    "tamanho_hectares" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "pastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "cpf_cnpj" VARCHAR(18),
    "celular" VARCHAR(20),
    "email" VARCHAR(150),
    "cep" VARCHAR(10),
    "endereco" VARCHAR(300),
    "bairro" VARCHAR(100),
    "cidade" VARCHAR(100),
    "estado" VARCHAR(2),
    "numero" VARCHAR(10),
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_custo" (
    "id" SERIAL NOT NULL,
    "descricao" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "categorias_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custos" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "categoria_custo_id" INTEGER,
    "registrado_por_id" INTEGER,
    "descricao" VARCHAR(300),
    "valor_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "data_custo" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "custos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custo_animais" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "custo_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "valor_cabeca" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custo_animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "registrado_por_id" INTEGER,
    "valor_total" DECIMAL(10,2),
    "custo_total" DECIMAL(10,2),
    "lucro" DECIMAL(10,2),
    "data_venda" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "venda_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "valor_final" DECIMAL(10,2),
    "custo_final" DECIMAL(10,2),
    "peso_final" DECIMAL(10,3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixa" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "descricao" VARCHAR(300) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "operacao" "TipoOperacaoCaixa" NOT NULL,
    "data_operacao" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registrado_por_id" INTEGER,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesagens" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "peso" DECIMAL(10,3) NOT NULL,
    "data_pesagem" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacinacoes" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "descricao" VARCHAR(200),
    "data_vacinacao" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacinacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "descricao" VARCHAR(200),
    "caminho" VARCHAR(500) NOT NULL,
    "data_foto" DATE,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manejo_reproducao" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "vaca_id" INTEGER NOT NULL,
    "boi_id" INTEGER NOT NULL,
    "data_corre" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manejo_reproducao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_pasto" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "pasto_origem_id" INTEGER NOT NULL,
    "pasto_destino_id" INTEGER NOT NULL,
    "data_movimento" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_pasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_lote" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "lote_origem_id" INTEGER NOT NULL,
    "lote_destino_id" INTEGER NOT NULL,
    "data_movimento" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencia_animais" (
    "id" SERIAL NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "fazenda_origem_id" INTEGER NOT NULL,
    "fazenda_destino_id" INTEGER NOT NULL,
    "pasto_destino_id" INTEGER,
    "lote_destino_id" INTEGER,
    "registrado_por_id" INTEGER,
    "data_transferencia" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transferencia_animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almoxarifados" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "almoxarifados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "categoria" "CategoriaProduto" NOT NULL,
    "unidade_medida" VARCHAR(20) NOT NULL,
    "estoque_minimo" DECIMAL(10,3),
    "saldo_atual" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "preco_medio" DECIMAL(10,2) DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "cpf_cnpj" VARCHAR(18),
    "telefone" VARCHAR(20),
    "email" VARCHAR(150),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_compra" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER NOT NULL,
    "solicitante_id" INTEGER,
    "status" "StatusPedido" NOT NULL DEFAULT 'RASCUNHO',
    "data_pedido" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "pedidos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_compra" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "valor_unitario" DECIMAL(10,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_pedido_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "produto_id" INTEGER NOT NULL,
    "almoxarifado_id" INTEGER NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "custo_unitario" DECIMAL(10,2),
    "data_movimento" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safras" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "safras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_bancarias" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "banco" VARCHAR(50),
    "agencia" VARCHAR(20),
    "conta" VARCHAR(20),
    "saldo_atual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_pagar" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER,
    "safra_id" INTEGER,
    "categoria_custo_id" INTEGER,
    "descricao" VARCHAR(300) NOT NULL,
    "valor_original" DECIMAL(10,2) NOT NULL,
    "valor_pago" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "data_vencimento" DATE NOT NULL,
    "data_pagamento" DATE,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "contas_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_receber" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "cliente_id" INTEGER,
    "safra_id" INTEGER,
    "descricao" VARCHAR(300) NOT NULL,
    "valor_original" DECIMAL(10,2) NOT NULL,
    "valor_recebido" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "data_vencimento" DATE NOT NULL,
    "data_recebimento" DATE,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "contas_receber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes_bancarias" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "conta_bancaria_id" INTEGER NOT NULL,
    "conta_pagar_id" INTEGER,
    "conta_receber_id" INTEGER,
    "tipo" "TipoOperacaoCaixa" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_transacao" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" VARCHAR(300) NOT NULL,
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "transacoes_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinas" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "marca_modelo" VARCHAR(100),
    "placa_chassi" VARCHAR(50),
    "tipo_medidor" "TipoMedidor" NOT NULL DEFAULT 'HORIMETRO',
    "medidor_atual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_hora" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abastecimentos" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "maquina_id" INTEGER NOT NULL,
    "produto_id" INTEGER,
    "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medidor" DECIMAL(10,2) NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abastecimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" SERIAL NOT NULL,
    "fazenda_id" INTEGER NOT NULL,
    "maquina_id" INTEGER NOT NULL,
    "fornecedor_id" INTEGER,
    "data" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medidor" DECIMAL(10,2) NOT NULL,
    "descricao" VARCHAR(300) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_codigo_key" ON "permissoes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_permissao_perfilId_permissaoId_key" ON "perfil_permissao"("perfilId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_permissao_usuarioId_permissaoId_key" ON "usuario_permissao"("usuarioId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fazendas_cpf_cnpj_key" ON "fazendas"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_fazenda_usuarioId_fazendaId_key" ON "usuario_fazenda"("usuarioId", "fazendaId");

-- CreateIndex
CREATE INDEX "animais_fazenda_id_status_idx" ON "animais"("fazenda_id", "status");

-- CreateIndex
CREATE INDEX "animais_lote_id_idx" ON "animais"("lote_id");

-- CreateIndex
CREATE INDEX "animais_raca_id_idx" ON "animais"("raca_id");

-- CreateIndex
CREATE INDEX "animais_pasto_id_idx" ON "animais"("pasto_id");

-- CreateIndex
CREATE INDEX "lotes_fazenda_id_idx" ON "lotes"("fazenda_id");

-- CreateIndex
CREATE INDEX "pastos_fazenda_id_idx" ON "pastos"("fazenda_id");

-- CreateIndex
CREATE INDEX "custos_fazenda_id_idx" ON "custos"("fazenda_id");

-- CreateIndex
CREATE INDEX "custos_categoria_custo_id_idx" ON "custos"("categoria_custo_id");

-- CreateIndex
CREATE UNIQUE INDEX "custo_animais_custo_id_animal_id_key" ON "custo_animais"("custo_id", "animal_id");

-- CreateIndex
CREATE INDEX "vendas_fazenda_id_idx" ON "vendas"("fazenda_id");

-- CreateIndex
CREATE INDEX "vendas_cliente_id_idx" ON "vendas"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "itens_venda_venda_id_animal_id_key" ON "itens_venda"("venda_id", "animal_id");

-- CreateIndex
CREATE INDEX "caixa_fazenda_id_idx" ON "caixa"("fazenda_id");

-- CreateIndex
CREATE INDEX "caixa_data_operacao_idx" ON "caixa"("data_operacao");

-- CreateIndex
CREATE INDEX "pesagens_fazenda_id_idx" ON "pesagens"("fazenda_id");

-- CreateIndex
CREATE INDEX "pesagens_animal_id_data_pesagem_idx" ON "pesagens"("animal_id", "data_pesagem");

-- CreateIndex
CREATE INDEX "vacinacoes_fazenda_id_idx" ON "vacinacoes"("fazenda_id");

-- CreateIndex
CREATE INDEX "vacinacoes_animal_id_idx" ON "vacinacoes"("animal_id");

-- CreateIndex
CREATE INDEX "manejo_reproducao_fazenda_id_idx" ON "manejo_reproducao"("fazenda_id");

-- CreateIndex
CREATE INDEX "manejo_reproducao_vaca_id_idx" ON "manejo_reproducao"("vaca_id");

-- CreateIndex
CREATE INDEX "movimentos_pasto_fazenda_id_idx" ON "movimentos_pasto"("fazenda_id");

-- CreateIndex
CREATE INDEX "movimentos_pasto_animal_id_idx" ON "movimentos_pasto"("animal_id");

-- CreateIndex
CREATE INDEX "movimentos_lote_fazenda_id_idx" ON "movimentos_lote"("fazenda_id");

-- CreateIndex
CREATE INDEX "movimentos_lote_animal_id_idx" ON "movimentos_lote"("animal_id");

-- CreateIndex
CREATE INDEX "transferencia_animais_animal_id_idx" ON "transferencia_animais"("animal_id");

-- CreateIndex
CREATE INDEX "transferencia_animais_fazenda_origem_id_idx" ON "transferencia_animais"("fazenda_origem_id");

-- CreateIndex
CREATE INDEX "transferencia_animais_fazenda_destino_id_idx" ON "transferencia_animais"("fazenda_destino_id");

-- CreateIndex
CREATE INDEX "almoxarifados_fazenda_id_idx" ON "almoxarifados"("fazenda_id");

-- CreateIndex
CREATE INDEX "produtos_fazenda_id_idx" ON "produtos"("fazenda_id");

-- CreateIndex
CREATE INDEX "pedidos_compra_fazenda_id_idx" ON "pedidos_compra"("fazenda_id");

-- CreateIndex
CREATE UNIQUE INDEX "itens_pedido_compra_pedido_id_produto_id_key" ON "itens_pedido_compra"("pedido_id", "produto_id");

-- CreateIndex
CREATE INDEX "movimentos_estoque_fazenda_id_idx" ON "movimentos_estoque"("fazenda_id");

-- CreateIndex
CREATE INDEX "movimentos_estoque_produto_id_almoxarifado_id_idx" ON "movimentos_estoque"("produto_id", "almoxarifado_id");

-- CreateIndex
CREATE INDEX "safras_fazenda_id_idx" ON "safras"("fazenda_id");

-- CreateIndex
CREATE INDEX "contas_bancarias_fazenda_id_idx" ON "contas_bancarias"("fazenda_id");

-- CreateIndex
CREATE INDEX "contas_pagar_fazenda_id_status_idx" ON "contas_pagar"("fazenda_id", "status");

-- CreateIndex
CREATE INDEX "contas_receber_fazenda_id_status_idx" ON "contas_receber"("fazenda_id", "status");

-- CreateIndex
CREATE INDEX "transacoes_bancarias_fazenda_id_idx" ON "transacoes_bancarias"("fazenda_id");

-- CreateIndex
CREATE INDEX "transacoes_bancarias_conta_bancaria_id_data_transacao_idx" ON "transacoes_bancarias"("conta_bancaria_id", "data_transacao");

-- CreateIndex
CREATE INDEX "maquinas_fazenda_id_idx" ON "maquinas"("fazenda_id");

-- CreateIndex
CREATE INDEX "abastecimentos_fazenda_id_idx" ON "abastecimentos"("fazenda_id");

-- CreateIndex
CREATE INDEX "abastecimentos_maquina_id_idx" ON "abastecimentos"("maquina_id");

-- CreateIndex
CREATE INDEX "manutencoes_fazenda_id_idx" ON "manutencoes"("fazenda_id");

-- CreateIndex
CREATE INDEX "manutencoes_maquina_id_idx" ON "manutencoes"("maquina_id");

-- AddForeignKey
ALTER TABLE "perfil_permissao" ADD CONSTRAINT "perfil_permissao_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_permissao" ADD CONSTRAINT "perfil_permissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permissao" ADD CONSTRAINT "usuario_permissao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permissao" ADD CONSTRAINT "usuario_permissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fazendas" ADD CONSTRAINT "fazendas_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "fazendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_fazenda" ADD CONSTRAINT "usuario_fazenda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_fazenda" ADD CONSTRAINT "usuario_fazenda_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "fazendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "racas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_pasto_id_fkey" FOREIGN KEY ("pasto_id") REFERENCES "pastos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastos" ADD CONSTRAINT "pastos_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos" ADD CONSTRAINT "custos_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos" ADD CONSTRAINT "custos_categoria_custo_id_fkey" FOREIGN KEY ("categoria_custo_id") REFERENCES "categorias_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos" ADD CONSTRAINT "custos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custo_animais" ADD CONSTRAINT "custo_animais_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custo_animais" ADD CONSTRAINT "custo_animais_custo_id_fkey" FOREIGN KEY ("custo_id") REFERENCES "custos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custo_animais" ADD CONSTRAINT "custo_animais_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa" ADD CONSTRAINT "caixa_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa" ADD CONSTRAINT "caixa_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesagens" ADD CONSTRAINT "pesagens_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesagens" ADD CONSTRAINT "pesagens_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacinacoes" ADD CONSTRAINT "vacinacoes_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacinacoes" ADD CONSTRAINT "vacinacoes_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manejo_reproducao" ADD CONSTRAINT "manejo_reproducao_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manejo_reproducao" ADD CONSTRAINT "manejo_reproducao_vaca_id_fkey" FOREIGN KEY ("vaca_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manejo_reproducao" ADD CONSTRAINT "manejo_reproducao_boi_id_fkey" FOREIGN KEY ("boi_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pasto" ADD CONSTRAINT "movimentos_pasto_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pasto" ADD CONSTRAINT "movimentos_pasto_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pasto" ADD CONSTRAINT "movimentos_pasto_pasto_origem_id_fkey" FOREIGN KEY ("pasto_origem_id") REFERENCES "pastos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pasto" ADD CONSTRAINT "movimentos_pasto_pasto_destino_id_fkey" FOREIGN KEY ("pasto_destino_id") REFERENCES "pastos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_lote" ADD CONSTRAINT "movimentos_lote_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_lote" ADD CONSTRAINT "movimentos_lote_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_lote" ADD CONSTRAINT "movimentos_lote_lote_origem_id_fkey" FOREIGN KEY ("lote_origem_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_lote" ADD CONSTRAINT "movimentos_lote_lote_destino_id_fkey" FOREIGN KEY ("lote_destino_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_animais" ADD CONSTRAINT "transferencia_animais_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_animais" ADD CONSTRAINT "transferencia_animais_fazenda_origem_id_fkey" FOREIGN KEY ("fazenda_origem_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_animais" ADD CONSTRAINT "transferencia_animais_fazenda_destino_id_fkey" FOREIGN KEY ("fazenda_destino_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_animais" ADD CONSTRAINT "transferencia_animais_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almoxarifados" ADD CONSTRAINT "almoxarifados_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_almoxarifado_id_fkey" FOREIGN KEY ("almoxarifado_id") REFERENCES "almoxarifados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safras" ADD CONSTRAINT "safras_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_bancarias" ADD CONSTRAINT "contas_bancarias_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_safra_id_fkey" FOREIGN KEY ("safra_id") REFERENCES "safras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_categoria_custo_id_fkey" FOREIGN KEY ("categoria_custo_id") REFERENCES "categorias_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_safra_id_fkey" FOREIGN KEY ("safra_id") REFERENCES "safras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_bancarias" ADD CONSTRAINT "transacoes_bancarias_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_bancarias" ADD CONSTRAINT "transacoes_bancarias_conta_bancaria_id_fkey" FOREIGN KEY ("conta_bancaria_id") REFERENCES "contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_bancarias" ADD CONSTRAINT "transacoes_bancarias_conta_pagar_id_fkey" FOREIGN KEY ("conta_pagar_id") REFERENCES "contas_pagar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_bancarias" ADD CONSTRAINT "transacoes_bancarias_conta_receber_id_fkey" FOREIGN KEY ("conta_receber_id") REFERENCES "contas_receber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimentos" ADD CONSTRAINT "abastecimentos_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimentos" ADD CONSTRAINT "abastecimentos_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "fazendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "maquinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SeedAuthorizationBaseline
INSERT INTO "permissoes" ("codigo", "nome", "modulo", "categoria", "updatedAt") VALUES
  ('animais:ler', 'Ler animais', 'Animais', 'operacional', CURRENT_TIMESTAMP),
  ('animais:criar', 'Criar animais', 'Animais', 'operacional', CURRENT_TIMESTAMP),
  ('animais:editar', 'Editar animais', 'Animais', 'operacional', CURRENT_TIMESTAMP),
  ('animais:excluir', 'Excluir animais', 'Animais', 'operacional', CURRENT_TIMESTAMP),
  ('fazendas:ler', 'Ler fazendas', 'Fazendas', 'administracao', CURRENT_TIMESTAMP),
  ('fazendas:gerenciar', 'Gerenciar fazendas', 'Fazendas', 'administracao', CURRENT_TIMESTAMP),
  ('usuarios:gerenciar', 'Gerenciar usuários', 'Usuários', 'administracao', CURRENT_TIMESTAMP),
  ('financeiro:ler', 'Ler financeiro', 'Financeiro', 'financeiro', CURRENT_TIMESTAMP),
  ('financeiro:gerenciar', 'Gerenciar financeiro', 'Financeiro', 'financeiro', CURRENT_TIMESTAMP)
ON CONFLICT ("codigo") DO NOTHING;

INSERT INTO "perfis" ("nome", "descricao", "updatedAt") VALUES
  ('Administrador', 'Acesso administrativo à organização', CURRENT_TIMESTAMP),
  ('Proprietário', 'Acesso do proprietário da fazenda', CURRENT_TIMESTAMP),
  ('Colaborador', 'Acesso operacional limitado', CURRENT_TIMESTAMP)
ON CONFLICT ("nome") DO NOTHING;

INSERT INTO "perfil_permissao" ("perfilId", "permissaoId")
SELECT perfil."id", permissao."id"
FROM "perfis" perfil
CROSS JOIN "permissoes" permissao
WHERE perfil."nome" IN ('Administrador', 'Proprietário')
ON CONFLICT ("perfilId", "permissaoId") DO NOTHING;
