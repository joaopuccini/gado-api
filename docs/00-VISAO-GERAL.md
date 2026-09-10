# 🐂 Gado API — Visão Geral da Arquitetura

> **Fonte da verdade** para toda a equipe e IAs. Atualizado em: 2026-09-10.

---

## 1. O que é o Gado API?

Sistema **SaaS Multi-Tenant** de gestão pecuária. Cada cliente (organização) opera em um **schema PostgreSQL isolado**, garantindo segregação de dados completa. O backend é construído em **NestJS + Prisma + PostgreSQL (Neon)**.

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | NestJS 11.x |
| ORM | Prisma 7.x (com `@prisma/adapter-pg`) |
| Banco de Dados | PostgreSQL (Neon) |
| Autenticação | JWT + Passport (Email/Senha + Google OAuth) |
| Validação | class-validator + class-transformer |
| Documentação | Swagger / OpenAPI 2.0 |
| Segurança | Helmet, CORS restritivo, ThrottlerGuard (rate limiting) |
| Hashing | bcrypt |

## 3. Arquitetura de Bancos (Multi-Tenant)

```
┌──────────────────────────────────────────┐
│              PostgreSQL (Neon)            │
├──────────────────────────────────────────┤
│  Schema: gado_admin                      │  ← Dados SaaS globais
│    ├── organizacoes                      │
│    ├── planos / assinaturas / pagamentos │
│    ├── tenant_registry                   │
│    ├── admin_users                       │
│    ├── usuarios_globais                  │
│    ├── acesso_organizacoes               │
│    └── convites                          │
├──────────────────────────────────────────┤
│  Schema: fazenda_{slug}   (por tenant)   │  ← Dados operacionais isolados
│    ├── usuarios / perfis / permissoes    │
│    ├── fazendas (com hierarquia parent)  │
│    ├── animais / racas / lotes / pastos  │
│    ├── custos / vendas / caixa           │
│    ├── vacinacoes / pesagens / fotos     │
│    ├── manejo_reproducao                 │
│    ├── movimentos_pasto / _lote          │
│    ├── transferencia_animais             │
│    ├── almoxarifados / produtos / ...    │
│    ├── contas_bancarias / pagar/receber  │
│    ├── safras                            │
│    └── maquinas / abastecimentos / ...   │
└──────────────────────────────────────────┘
```

## 4. Mapa de Módulos NestJS

### Infraestrutura
| Módulo | Responsabilidade |
|---|---|
| `PrismaModule` | Provê o PrismaClient base |
| `TenantModule` | Middleware de resolução de tenant + pool de PrismaClient por schema |
| `AuthModule` | Login (email/senha), Google OAuth, JWT, PermissionsGuard |
| `AdminModule` | Gestão SaaS: Organizações, Planos, Assinaturas, AdminUsers |

### Domínio Operacional (dentro do tenant)
| Módulo | Responsabilidade |
|---|---|
| `AnimaisModule` | CRUD de animais, transferência entre fazendas |
| `LotesModule` | CRUD de lotes |
| `RacasModule` | CRUD de raças |
| `PastosModule` | CRUD de pastos (com geojson) |
| `ClientesModule` | CRUD de clientes/compradores |
| `CustosModule` | Custos gerais e custos por animal |
| `VendasModule` | Vendas com itens (animais vendidos) |
| `CaixaModule` | Caixa operacional (entrada/saída/ajuste) |
| `VacinacaoModule` | Registro de vacinações |
| `ManejoModule` | Manejo reprodutivo (vaca × boi) |
| `MovimentacoesModule` | Movimentação entre pastos e lotes |
| `FotosModule` | Fotos de animais |
| `DashboardModule` | Agregações para painel (contadores, financeiro, evolução peso) |
| `FazendasModule` | CRUD de fazendas (hierarquia parent/filha) |

### Suprimentos (dentro do tenant)
| Módulo | Responsabilidade |
|---|---|
| `AlmoxarifadosModule` | CRUD de almoxarifados |
| `ProdutosModule` | CRUD de produtos (vacinas, ração, combustível...) |
| `FornecedoresModule` | CRUD de fornecedores |
| `MovimentoEstoqueModule` | Entrada/saída/ajuste de estoque |
| `PedidosCompraModule` | Pedidos de compra com status |

### Financeiro Avançado (dentro do tenant)
| Módulo | Responsabilidade |
|---|---|
| `ContasBancariasModule` | Contas bancárias da fazenda |
| `ContasPagarModule` | Contas a pagar (com safra e fornecedor) |
| `ContasReceberModule` | Contas a receber (com safra e cliente) |
| `TransacoesBancariasModule` | Transações e conciliação bancária |
| `SafrasModule` | Períodos safra (agrupador financeiro) |

### Frota (dentro do tenant)
| Módulo | Responsabilidade |
|---|---|
| `MaquinasModule` | Cadastro de máquinas (horímetro/hodômetro) |
| `AbastecimentosModule` | Registro de abastecimentos |
| `ManutencoesModule` | Registro de manutenções |

## 5. Providers Globais

| Provider | Tipo | Função |
|---|---|---|
| `AllExceptionsFilter` | APP_FILTER | Tratamento global de exceções |
| `LoggingInterceptor` | APP_INTERCEPTOR | Log de request/response |
| `HierarchyInterceptor` | APP_INTERCEPTOR | Expande `accessibleFazendaIds` (matriz + filhas) |
| `ThrottlerGuard` | APP_GUARD | Rate limiting (100 req/60s default) |
| `SubscriptionGuard` | APP_GUARD | Verifica assinatura ativa antes de cada request |
| `RequestContextMiddleware` | Middleware Global | Popula AsyncLocalStorage com dados do request |

## 6. Documentos Detalhados

| Documento | O que cobre |
|---|---|
| [01-FLUXO-AUTENTICACAO.md](./01-FLUXO-AUTENTICACAO.md) | Login email/senha, Google OAuth, seleção de fazenda, JWT |
| [02-MULTI-TENANT.md](./02-MULTI-TENANT.md) | Resolução de tenant, pool de PrismaClient, schema isolation |
| [03-RBAC-PERFIS.md](./03-RBAC-PERFIS.md) | Roles, permissões, guards, matrix RBAC |
| [04-HIERARQUIA-FAZENDAS.md](./04-HIERARQUIA-FAZENDAS.md) | Visão matriz, fazendas filhas, transferências |
| [05-MODULOS-DOMINIO.md](./05-MODULOS-DOMINIO.md) | Detalhamento de cada módulo operacional |
| [06-ADMIN-SAAS.md](./06-ADMIN-SAAS.md) | Painel Admin, Organizações, Planos, Billing |
| [07-INFRAESTRUTURA.md](./07-INFRAESTRUTURA.md) | Middleware, interceptors, filters, context |
| [PLANO_DE_MIGRACAO.md](./PLANO_DE_MIGRACAO.md) | Plano de migração front-end legado → React |
