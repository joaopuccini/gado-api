# Progress Tracker — Gado SaaS

> **REGRA:** Toda LLM que completar uma task ou sub-item DEVE atualizar este arquivo
> antes de encerrar a sessão. Isso garante continuidade caso a quota estoure ou
> o modelo seja trocado.

## Como usar este arquivo

1. Ao **iniciar uma sessão**, leia este arquivo para saber onde parou.
2. Ao **completar um sub-item**, marque `[x]` e registre o commit hash na coluna `Commit`.
3. Ao **completar uma task inteira**, marque `[x]` na linha da task e preencha `Evidência`.
4. Ao **encerrar a sessão** (por qualquer motivo), registre em `Sessões` no final deste arquivo.
5. **Nunca apague** linhas — apenas marque como concluídas.

---

## Onda 00 — Fundações Backend

**Status: ✅ CONCLUÍDA** | Gate G0: PASS | Evidência: `docs/testing/wave-00-backend-foundation.tdd.md`

Tasks 1–12 concluídas. Commits `e9a2887` até `da482a8`. Coverage: 96.35% stmts.

**NÃO REFAZER.**

---

## Onda 02 — Identidade, RBAC e Provisionamento

**Status: ⬜ NÃO INICIADA** | Repo: `gado-api` | Dependência: Onda 00 ✅

> [!NOTE]
> A Onda 02 é executada antes da Onda 01 porque o frontend precisa de contratos
> de identidade/RBAC reais para consumir. A lei de engenharia proíbe frontend com API mockada.

### Task 2.1: Catálogo de permissões (ADR-0003)

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 2.1.1 | Criar `src/common/rbac/permissions-catalog.ts` com `PERMISSIONS_CATALOG` (IDs estáveis) | `[x]` | 1616bc8 | `permissions-catalog.ts` |
| 2.1.2 | Criar `src/common/rbac/default-profiles.ts` com `DEFAULT_PROFILE_PERMISSIONS` por FazendaRole | `[x]` | 1616bc8 | `default-profiles.ts` |
| 2.1.3 | Refatorar `rbac.config.ts` para derivar `RolePermissions` do catálogo | `[x]` | 1616bc8 | `rbac.config.ts` |
| 2.1.4 | **RED**: teste de validação — @RequirePermissions vs catálogo (órfãs, duplicatas, IDs) | `[x]` | 0ff7095 | `permissions-catalog.spec.ts` |
| 2.1.5 | **GREEN**: implementar validação e corrigir até verde | `[x]` | 0ff7095 | |
| 2.1.6 | **RED**: teste do endpoint `GET /permissions/catalog` | `[x]` | 37ae700 | `permissions.controller.spec.ts` |
| 2.1.7 | **GREEN**: criar controller e UseCase do catálogo | `[x]` | 7813ff0 | `permissions.controller.ts` |

**Task 2.1 concluída?** `[x]` | **Evidência:** API endpoint implementado e coberto por testes |

---

### Task 2.2: Identidades e audiences

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 2.2.1 | **RED**: token operacional rejeitado em `/api/v1/admin/*` | `[x]` | 784e6ff | `admin-audience.e2e-spec.ts` |
| 2.2.1b | **GREEN**: implementar validação de audience | `[x]` | 91f6570 | `jwt.strategy.ts` |
| 2.2.2 | **RED/GREEN**: token admin rejeitado em dados tenant | `[x]` | b88ab30 | `tenant-audience.e2e-spec.ts` |
| 2.2.3 | Modelar e migrar `AdminUser`, `UsuarioGlobal`, `AcessoOrganizacao` (revisar schema existente) | `[x]` | e4f4c3f | `schema.prisma` (admin) |
| 2.2.4 | Modelar e migrar `Usuario`, `UsuarioFazenda` (revisar schema existente) | `[x]` | b0da16b | `schema.prisma` (tenant) |
| 2.2.5 | **RED**: login administrativo por UseCase separado | `[x]` | 175904d | `admin-login.use-case.spec.ts` |
| 2.2.6 | **GREEN**: implementar login admin | `[x]` | 175904d | `admin-login.use-case.ts` |
| 2.2.7 | **RED**: login operacional por UseCase separado | `[x]` | b45163f | `tenant-login.use-case.spec.ts` |
| 2.2.8 | **GREEN**: implementar login operacional | `[x]` | 768e190 | `tenant-login.use-case.ts` |
| 2.2.9 | Validar `aud`, expiração, organização, tenant, fazenda e revogação antes do contexto | `[x]` | 2bd8308 | `jwt-strategy.ts`, guards |
| 2.2.10 | **GREEN**: testes de audience passam | `[x]` | 2bd8308 | |
| 2.2.11 | Aplicar @RequirePermissions por decorator/guard em todas as rotas migradas | `[x]` | 1a88887 | `permissions.controller.ts`, `permissions-catalog.spec.ts` |

**Task 2.2 concluída?** `[ ]` | **Evidência:** |

---

### Task 2.3: Provisionamento idempotente

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 2.3.1 | **RED**: state machine `registered → provisioning → migrations → seeding → validating → active` | `[x]` | 57e4633, 58ce7b6 | `provisioning-state.spec.ts`, `provisioning-run-schema.spec.ts` |
| 2.3.2 | **GREEN**: implementar state machine e `ProvisioningRun` no admin | `[x]` | 9d5828d | `provisioning-run.ts`, `schema.prisma`, migration admin |
| 2.3.3 | **RED**: criação de schema, aplicação de migrations | `[x]` | 8097ed0 | `provision-schema.use-case.spec.ts` |
| 2.3.4 | **GREEN**: implementar criação de schema e migrations | `[x]` | fb9d5e4 | `provision-schema.use-case.ts` |
| 2.3.5 | **RED**: sync de permissões — ler catálogo, upsert na tabela `permissoes` do tenant | `[x]` | f24ec32 | `sync-permissions.spec.ts` |
| 2.3.6 | **GREEN**: implementar sync de permissões no provisioning | `[x]` | f40059a, 56c666d, 53d7949 | `sync-permissions.service.ts` |
| 2.3.7 | **RED**: criação de perfis-base a partir de `DEFAULT_PROFILE_PERMISSIONS` | `[x]` | 8f0bae5 | `seed-profiles.spec.ts` |
| 2.3.8 | **GREEN**: implementar seed de perfis-base | `[x]` | ae6da72, b601bc1, ba9d9af | `seed-profiles.service.ts` |
| 2.3.9 | **RED**: criação de usuário local, fazenda principal e smoke queries | `[x]` | 9777efb | `provision-tenant.spec.ts` |
| 2.3.10 | **GREEN**: implementar provisioning completo | `[x]` | c4e522f | Fluxo completo validado por gates unitários, arquitetura, migrations, isolamento, build e integração Neon descartável |
| 2.3.11 | **RED**: outbox de onboarding + adapter SES | `[ ]` | | `onboarding-outbox.spec.ts` |
| 2.3.12 | **GREEN**: implementar outbox e SES adapter | `[ ]` | | |
| 2.3.13 | **RED**: retry após falha em cada etapa sem duplicar recursos | `[ ]` | | `provisioning-retry.spec.ts` |
| 2.3.14 | **GREEN**: implementar retry idempotente | `[ ]` | | |
| 2.3.15 | **RED**: retornar `202` e endpoint de status até tenant `active` | `[ ]` | | `provisioning-status.spec.ts` |
| 2.3.16 | **GREEN**: implementar endpoint de status | `[ ]` | | |

**Task 2.3 concluída?** `[ ]` | **Evidência:** |

---

### Gate G1-identity

| Critério | Status |
|---|---|
| Cadastro por e-mail produz estado final correto | `[ ]` |
| Cadastro por Google produz mesmo estado final | `[ ]` |
| Falhas são retomáveis (retry em cada etapa) | `[ ]` |
| Token só é emitido para tenant ativo | `[ ]` |
| Permissões sincronizadas do catálogo no provisioning | `[ ]` |
| Perfis-base criados automaticamente | `[ ]` |
| Testes unitários, integração, isolamento passam | `[ ]` |
| Coverage da mudança ≥ 80% | `[ ]` |

**Onda 02 concluída?** `[ ]` | **Handoff criado?** `[ ]` (`docs/handoffs/YYYY-MM-DD-wave-02-complete.md`)

---

## Onda 01 — Dois Frontends e Plataforma Compartilhada

**Status: ⬜ NÃO INICIADA** | Repo: `gado-web` | Dependência: Onda 00 ✅ + Contratos da Onda 02

### Task 1.1: Criar workspace e builds independentes

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 1.1.1 | **RED**: teste que falha quando imports de `gado-app` alcançam `gado-admin` | `[ ]` | | `import-boundaries.spec.ts` |
| 1.1.2 | **RED**: smoke tests separados para `/login` do cliente e `/login` admin | `[ ]` | | `app-login.spec.ts`, `admin-login.spec.ts` |
| 1.1.3 | Criar estrutura: `apps/gado-app`, `apps/gado-admin`, `packages/*` | `[ ]` | | `package.json`, `tsconfig.json` |
| 1.1.4 | Mover shell para deixar testes verdes | `[ ]` | | |
| 1.1.5 | **GREEN**: `npm run build:app` e `npm run build:admin` geram diretórios distintos | `[ ]` | | |
| 1.1.6 | Registrar RED/GREEN em `docs/testing/wave-01-frontend-platform.tdd.md` | `[ ]` | | |

**Task 1.1 concluída?** `[ ]` | **Evidência:** |

---

### Task 1.2: Contratos, HTTP e sessão compartilhados

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 1.2.1 | Gerar tipos a partir do OpenAPI aprovado | `[ ]` | | `packages/contracts` |
| 1.2.2 | **RED**: testes do client HTTP (token, requestId, tenant, envelopes) | `[ ]` | | `api-client.spec.ts` |
| 1.2.3 | **GREEN**: implementar client HTTP central | `[ ]` | | `packages/api-client` |
| 1.2.4 | **RED**: testes de expiração, logout, 401, 403, 400, 500 | `[ ]` | | `error-handling.spec.ts` |
| 1.2.5 | **GREEN**: implementar handling de erros | `[ ]` | | |
| 1.2.6 | Implementar route guards visuais (autorização real no backend) | `[ ]` | | `packages/auth` |
| 1.2.7 | Regra de lint: proibir `axios.create` fora de `packages/api-client` | `[ ]` | | `.eslintrc` |

**Task 1.2 concluída?** `[ ]` | **Evidência:** |

---

### Gate G1-frontend

| Critério | Status |
|---|---|
| Dois apps fazem build independente | `[ ]` |
| Admin não está no bundle do cliente | `[ ]` |
| Nenhuma tela usa API mockada | `[ ]` |
| Client HTTP central funciona com contratos gerados | `[ ]` |
| Coverage da mudança ≥ 80% | `[ ]` |

**Onda 01 concluída?** `[ ]` | **Handoff criado?** `[ ]` (`docs/handoffs/YYYY-MM-DD-wave-01-complete.md`)

---

## Onda 03 — Conta, Fazendas, Equipe e Assinatura

**Status: ⬜ NÃO INICIADA** | Dependência: Onda 02 ✅

### Task 3.1: Fazendas e hierarquia

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 3.1.1 | **RED**: CRUD de fazenda (criação, edição, seleção, ativo/inativo) | `[ ]` | | `fazenda.use-case.spec.ts` |
| 3.1.2 | **GREEN**: implementar UseCase de fazenda | `[ ]` | | |
| 3.1.3 | **RED**: hierarquia matriz/filiais e escopo de acesso | `[ ]` | | `fazenda-hierarchy.spec.ts` |
| 3.1.4 | **GREEN**: substituir `HierarchyInterceptor` por policy/UseCase | `[ ]` | | |
| 3.1.5 | **RED**: pai autorizado vê filhas permitidas, nunca vê fazenda de outro tenant | `[ ]` | | `fazenda-isolation.spec.ts` |
| 3.1.6 | **GREEN**: implementar isolamento | `[ ]` | | |

**Task 3.1 concluída?** `[ ]` | **Evidência:** |

---

### Task 3.2: Equipe e perfis

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 3.2.1 | **RED**: convite, aceite, expiração, reenvio, revogação | `[ ]` | | `convite.use-case.spec.ts` |
| 3.2.2 | **GREEN**: implementar fluxo de convites | `[ ]` | | |
| 3.2.3 | **RED**: limites do plano (max usuários, max fazendas) | `[ ]` | | `plan-limits.spec.ts` |
| 3.2.4 | **GREEN**: implementar validação de limites | `[ ]` | | |
| 3.2.5 | **RED**: atribuição de perfis e vínculo `UsuarioFazenda` | `[ ]` | | `perfil-assignment.spec.ts` |
| 3.2.6 | **GREEN**: implementar atribuição | `[ ]` | | |
| 3.2.7 | **RED**: perfil customizado — proprietário cria perfil, seleciona permissões do catálogo | `[ ]` | | `custom-profile.spec.ts` |
| 3.2.8 | **GREEN**: implementar perfil customizado (ADR-0003) | `[ ]` | | |
| 3.2.9 | **RED**: allow/deny para proprietário, gerente, operador, visualizador | `[ ]` | | `role-access.spec.ts` |
| 3.2.10 | **GREEN**: implementar testes de acesso | `[ ]` | | |

**Task 3.2 concluída?** `[ ]` | **Evidência:** |

---

### Task 3.3: Autosserviço (frontend)

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 3.3.1 | Tela de conta da organização no `gado-app` | `[ ]` | | |
| 3.3.2 | Tela de fazendas no `gado-app` | `[ ]` | | |
| 3.3.3 | Tela de equipe no `gado-app` | `[ ]` | | |
| 3.3.4 | Tela de resumo da assinatura e limites no `gado-app` | `[ ]` | | |
| 3.3.5 | **RED**: E2E — proprietário não tem rota/link/bundle/token aceito no `gado-admin` | `[ ]` | | `admin-isolation.e2e.spec.ts` |
| 3.3.6 | **GREEN**: isolamento confirmado | `[ ]` | | |

**Task 3.3 concluída?** `[ ]` | **Evidência:** |

---

### Gate G2-account

| Critério | Status |
|---|---|
| Proprietário administra organização pelo `gado-app` | `[ ]` |
| Suporte usa somente `gado-admin` | `[ ]` |
| Perfis customizados funcionam (ADR-0003) | `[ ]` |
| Convites e limites de plano validados | `[ ]` |

**Onda 03 concluída?** `[ ]` | **Handoff criado?** `[ ]`

---

## Ondas 04–11

> As tasks detalhadas das Ondas 04–11 serão decompostas no plano detalhado de cada onda,
> seguindo o mesmo padrão. Isso será feito quando a onda anterior estiver verde.
> O plano mestre (`2026-09-12-gado-saas-master.md`) contém a visão geral de cada onda.

| Onda | Resumo | Status |
|---|---|---|
| 04 — Rebanho básico | Raças, lotes, animais com paridade | `⬜` |
| 05 — Pesagens e dashboard | Indicadores reais sem mocks | `⬜` |
| 06 — Manejo, sanidade, fotos | Movimentações, vacinação, storage | `⬜` |
| 07 — Comercial e financeiro | Ledger, vendas, custos, caixa | `⬜` |
| 08 — Admin e billing | gado-admin interno + dashboard SaaS | `⬜` |
| 09 — ETL e reconciliação | Migração repetível por tenant | `⬜` |
| 10 — Cutover | Desligamento dos legados | `⬜` |
| 11 — Expansão | Suprimentos, frota, financeiro avançado | `⬜` |

---

## Sessões

> Toda sessão de trabalho DEVE registrar uma linha aqui ao encerrar.

| Data/Hora | Modelo | Onda | Última task concluída | Próxima task | Motivo de parada |
|---|---|---|---|---|---|
| 2026-09-14 | — | 00 | Onda 00 completa (G0 pass) | Onda 02 Task 2.1 | Onda 00 entregue |
| 2026-09-16 21:45 | Antigravity | — | ADR-0003 criado | Onda 02 Task 2.1.1 | Planejamento concluído |
| 2026-09-16 22:35 | Antigravity | 02 | Onda 02 Task 2.1.7 | Onda 02 Task 2.2.1 | Troca de modelo/LLM a pedido do usuário |
| 2026-09-17 14:58 | Codex GPT-5 | 02 | Onda 02 Task 2.2.8 | Onda 02 Task 2.2.9 | Checkpoints RED/GREEN concluídos; regressões globais anteriores registradas na evidência TDD |
| 2026-09-17 15:43 | Codex GPT-5 | 02 | Onda 02 Task 2.3.4 | Onda 02 Task 2.3.5 | Checkpoint seguro após quatro pares RED/GREEN; dívida global preexistente registrada |
| 2026-09-17 | Codex GPT-5 | 02 | Onda 02 Task 2.3.4 | Onda 02 Task 2.3.5 | Plano detalhado para execução serial por um único agente criado; nenhuma task de implementação alterada |
| 2026-09-17 19:34 | Codex GPT-5 | 02 | Onda 02 Task 2.3.5 | Onda 02 Task 2.3.6 | GREEN focal em `f40059a`, mas gate arquitetural global falhou por `AdminLoginUseCase` e hash da migration publicada; 2.3.6 mantida aberta |
| 2026-09-17 21:34 | Codex GPT-5 | 02 | Onda 02 Task 2.3.7 | Onda 02 Task 2.3.8 | GREEN focal em `ae6da72` e arquitetura verde; gate de migrations não iniciou porque `TEST_DATABASE_URL` descartável não está definido |
| 2026-09-17 | Codex GPT-5 | 02 | Onda 02 Task 2.3.7 | Onda 02 Task 2.3.8 | Retomada auditada; `TEST_DATABASE_URL` segue ausente, `DATABASE_URL` não é descartável e não há PostgreSQL local disponível; nenhum gate ou código contornado |
| 2026-09-17 | Codex GPT-5 | 02 | Onda 02 Task 2.3.7 | Onda 02 Task 2.3.8 | URL pooled do banco principal recusada para migrations; credencial não foi persistida e deve ser rotacionada; gate segue aguardando banco descartável direto |

---

## Documentos de referência

| Documento | Path |
|---|---|
| Regras de engenharia | `.agent/rules/gado-saas-engineering.md` |
| Plano mestre | `docs/superpowers/plans/2026-09-12-gado-saas-master.md` |
| Wave 00 plan | `docs/superpowers/plans/2026-09-12-wave-00-backend-foundation.md` |
| Handoff Onda 00 | `docs/handoffs/2026-09-14-wave-00-complete.md` |
| ADR-0001 | `docs/architecture/adr/0001-dynamic-tenant-schema-with-prisma.md` |
| ADR-0002 | `docs/architecture/adr/0002-legacy-route-quarantine.md` |
| ADR-0003 | `docs/architecture/adr/0003-permissions-catalog-as-code-enum.md` |
| Evidências TDD Onda 00 | `docs/testing/wave-00-backend-foundation.tdd.md` |

---

## Instrução canônica para qualquer LLM

```
Antes de alterar qualquer arquivo:

1. Leia AGENTS.md e .agent/rules/gado-saas-engineering.md.
2. Leia este arquivo (docs/handoffs/progress-tracker.md) para saber o estado atual.
3. Leia o handoff mais recente em docs/handoffs/.
4. Execute git status --short e git log --oneline -5.
5. Não refaça tarefas já marcadas [x] neste tracker.
6. Preserve TDD com commits RED e GREEN.
7. Não use db push, migrate reset ou bancos/schemas não descartáveis.
8. Ao completar qualquer sub-item, marque [x] neste arquivo e registre o commit.
9. Ao encerrar a sessão, registre uma linha na tabela Sessões.
10. Ao completar uma onda, crie handoff em docs/handoffs/YYYY-MM-DD-wave-NN-complete.md.
```
