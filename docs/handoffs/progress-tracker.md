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

**Status: ✅ CONCLUÍDA** | Repo: `gado-api` | Dependência: Onda 00 ✅

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

**Task 2.2 concluída?** `[x]` | **Evidência:** login admin composto por ports/adapters (`b3b6171`), testes focais 6/6 e arquitetura 22/22 |

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
| 2.3.11 | **RED**: outbox de onboarding + adapter SES | `[x]` | 9a0667b | `onboarding-outbox.spec.ts` |
| 2.3.12 | **GREEN**: implementar outbox e SES adapter | `[x]` | df2943b | Focused outbox spec, ESLint do escopo, arquitetura, build e `prisma validate` admin |
| 2.3.13 | **RED**: retry após falha em cada etapa sem duplicar recursos | `[x]` | b9fcb80 | `provisioning-retry.spec.ts` falha contra assinatura antiga do orquestrador |
| 2.3.14 | **GREEN**: implementar retry idempotente | `[x]` | 60c2b5d | Retry unitário, compatibilidade do orquestrador, permissões, ESLint escopo, arquitetura, build e integração Neon descartável |
| 2.3.15 | **RED**: retornar `202` e endpoint de status até tenant `active` | `[x]` | 6370c63 | `provisioning-status.spec.ts` falha por `register`/status ausentes e Google legado |
| 2.3.16 | **GREEN**: implementar endpoint de status | `[x]` | b005c65 | Teste focal 3/3, contrato 9/9 e integração descartável 2/2 |

**Task 2.3 concluída?** `[x]` | **Evidência:** Gate G1 completo; lint `6a70099`, coverage `21b04a2`, tipos `7bde2d5`, schema validado na fronteira `b64802d` e fechamento `40f3f4a` |

---

### Gate G1-identity

| Critério | Status |
|---|---|
| Cadastro por e-mail produz estado final correto | `[x]` |
| Cadastro por Google produz mesmo estado final | `[x]` |
| Falhas são retomáveis (retry em cada etapa) | `[x]` |
| Token só é emitido para tenant ativo | `[x]` |
| Permissões sincronizadas do catálogo no provisioning | `[x]` |
| Perfis-base criados automaticamente | `[x]` |
| Testes unitários, integração, isolamento passam | `[x]` |
| Coverage da mudança ≥ 80% | `[x]` |

**Onda 02 concluída?** `[x]` | **Handoff criado?** `[x]` (`docs/handoffs/2026-09-21-wave-02-complete.md`)

---

## Onda 01 — Dois Frontends e Plataforma Compartilhada

**Status: ✅ CONCLUÍDA** | Repo: `gado-web` | Dependência: Onda 00 ✅ + Contratos da Onda 02 ✅ | Evidência: `gado-web/docs/testing/wave-01-frontend-platform.tdd.md`

### Task 1.1: Criar workspace e builds independentes

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 1.1.1 | **RED**: teste que falha quando imports de `gado-app` alcançam `gado-admin` | `[x]` | 0ff4e05 | `workspace-boundaries.spec.ts` |
| 1.1.2 | **RED**: smoke tests separados para `/login` do cliente e `/login` admin | `[x]` | 129501f | `app-router.spec.tsx`, `admin-router.spec.tsx` |
| 1.1.3 | Criar estrutura: `apps/gado-app`, `apps/gado-admin`, `packages/*` | `[x]` | 0619ab2, 129501f | `package.json`, `tsconfig.json`, `apps/*`, `packages/*` |
| 1.1.4 | Mover shell para deixar testes verdes | `[x]` | eb18724 | layouts, páginas e componentes isolados por app |
| 1.1.5 | **GREEN**: `npm run build:app` e `npm run build:admin` geram diretórios distintos | `[x]` | 129501f, 80a13ff | `dist/gado-app`, `dist/gado-admin`, bundle gate |
| 1.1.6 | Registrar RED/GREEN em `docs/testing/wave-01-frontend-platform.tdd.md` | `[x]` | 4b3e4f0 | relatório final com coverage e hashes |

**Task 1.1 concluída?** `[x]` | **Evidência:** builds independentes, fronteiras 7/7 e isolamento de bundles verdes |

---

### Task 1.2: Contratos, HTTP e sessão compartilhados

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 1.2.1 | Gerar tipos a partir do OpenAPI aprovado | `[x]` | 278d248 | `packages/contracts` |
| 1.2.2 | **RED**: testes do client HTTP (token, requestId, tenant, envelopes) | `[x]` | 40e8873 | `api-client.spec.ts` |
| 1.2.3 | **GREEN**: implementar client HTTP central | `[x]` | 40e8873 | `packages/api-client` |
| 1.2.4 | **RED**: testes de expiração, logout, 401, 403, 400, 500 | `[x]` | 40e8873, 2f266f9 | client e sessão cobertos |
| 1.2.5 | **GREEN**: implementar handling de erros | `[x]` | 40e8873 | `GadoApiError` e envelopes normalizados |
| 1.2.6 | Implementar route guards visuais (autorização real no backend) | `[x]` | 2f266f9 | `packages/auth` |
| 1.2.7 | Regra de lint: proibir `axios.create` fora de `packages/api-client` | `[x]` | 0ff4e05, eb18724 | gate arquitetural e `check:network` |

**Task 1.2 concluída?** `[x]` | **Evidência:** contratos determinísticos, client central, sessões/audiences isoladas e rede sem callers avulsos |

---

### Gate G1-frontend

| Critério | Status |
|---|---|
| Dois apps fazem build independente | `[x]` |
| Admin não está no bundle do cliente | `[x]` |
| Nenhuma tela usa API mockada | `[x]` |
| Client HTTP central funciona com contratos gerados | `[x]` |
| Coverage da mudança ≥ 80% | `[x]` |

**Onda 01 concluída?** `[x]` | **Handoff criado?** `[x]` (`docs/handoffs/2026-09-22-wave-01-complete.md`)

---

## Onda 03 — Conta, Fazendas, Equipe e Assinatura

**Status: 🟡 EM ANDAMENTO** | Dependência: Onda 02 ✅

**Plano ativo:** `docs/superpowers/plans/2026-09-22-wave-03-account.md` | Tasks 3.1, 3.2 e 7–10 concluídas; seguir pela Task 11, execução do Gate G2-account.

### Task 3.1: Fazendas e hierarquia

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 3.1.1 | **RED**: CRUD de fazenda (criação, edição, seleção, ativo/inativo) | `[x]` | b64cdf2, 87752e0, b8df121, 9217c34 | UseCases, adapter, HTTP e composição especificados antes da implementação |
| 3.1.2 | **GREEN**: implementar UseCase de fazenda | `[x]` | ef38e7a, 6fcccdf, 94f4513, 2c08aa3 | 166/166 unitários, arquitetura 23/23 e build verdes |
| 3.1.3 | **RED**: hierarquia matriz/filiais e escopo de acesso | `[x]` | 9e6d81f | `farm-hierarchy.policy.spec.ts` |
| 3.1.4 | **GREEN**: substituir `HierarchyInterceptor` por policy/UseCase | `[x]` | fea521b, f2cbd07, 9237b10 | Policy integrada; migration limpa/upgrade 2/2; 175/175 unitários, arquitetura 23/23 e build verdes |
| 3.1.5 | **RED**: pai autorizado vê filhas permitidas, nunca vê fazenda de outro tenant | `[x]` | 5e704f5 | `test/isolation/account-isolation.e2e-spec.ts` |
| 3.1.6 | **GREEN**: implementar isolamento | `[x]` | 2389b66 | Teste focal concorrente 3/3 em três execuções, isolamento completo 11/11, unitários 175/175, arquitetura 23/23 e build verdes |

**Task 3.1 concluída?** `[x]` | **Evidência:** hierarquia fail-closed por membership verificada; matriz vê somente filiais vinculadas, filial vê somente a si, outro tenant é negado e contexto ausente falha antes do repository |

---

### Task 3.2: Equipe e perfis

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 3.2.1 | **RED**: convite, aceite, expiração, reenvio, revogação | `[x]` | df26ae5 | `invitations.use-case.spec.ts` — 7 cenários de ciclo seguro |
| 3.2.2 | **GREEN**: implementar fluxo de convites | `[x]` | f0cd00f, ed658bd, 805c797 | Hash-only, aceite único, expiração, revogação e reenvio transacional; composição HTTP segura, resumo por organização e outbox durável; migrations admin 3/3 em banco filho descartável |
| 3.2.3 | **RED**: limites do plano (max usuários, max fazendas) | `[x]` | 2b007d1 | `plan-limit.policy.spec.ts` |
| 3.2.4 | **GREEN**: implementar validação de limites | `[x]` | 9c5e18f | Contadores ativos, igualdade bloqueada e assinatura ausente/expirada fail-closed |
| 3.2.5 | **RED**: atribuição de perfis e vínculo `UsuarioFazenda` | `[x]` | 7c319f5 | `profile-assignment.use-case.spec.ts` |
| 3.2.6 | **GREEN**: implementar atribuição | `[x]` | 4925021 | Usuário local por acesso aceito, vínculo idempotente, remoção lógica e escopo fail-closed |
| 3.2.7 | **RED**: perfil customizado — proprietário cria perfil, seleciona permissões do catálogo | `[x]` | 8967292 | `custom-profile.use-case.spec.ts` |
| 3.2.8 | **GREEN**: implementar perfil customizado (ADR-0003) | `[x]` | e3785ea | Perfis por fazenda, permissões ativas, DTO/controller e migration limpa/upgrade 2/2 |
| 3.2.9 | **RED**: allow/deny para proprietário, gerente, operador, visualizador | `[x]` | c6e54e1 | `role-access.spec.ts` |
| 3.2.10 | **GREEN**: implementar testes de acesso | `[x]` | b802230 | Matriz DONO/GESTOR/COLABORADOR/CONSULTOR para leitura, escrita e gestão de conta |

**Task 3.2 concluída?** `[x]` | **Evidência:** focais 21/21, unitários 210/210, arquitetura 23/23, lint do escopo, build e migration tenant limpa/upgrade 2/2 verdes |

---

### Task 7: Contratos de conta e assinatura

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 7.1 | **RED**: contrato OpenAPI das operações `/api/v1/account/*` | `[x]` | 7dc7dae | `account-openapi.e2e-spec.ts` — rotas, auth, envelopes, erros e ausência de mutação admin |
| 7.2 | **GREEN**: publicar leitura da organização e resumo da assinatura | `[x]` | 6f07d51 | Portas por `organizationId` verificado, DTOs públicos, contadores admin/tenant e decorators OpenAPI comuns |

**Task 7 concluída?** `[x]` | **Evidência:** contrato 14/14, unitários 214/214, arquitetura 23/23, lint do escopo, `git diff --check` e build verdes; nenhum campo de schema, billing interno, senha, token ou Prisma publicado |

---

### Task 8: Cliente e gateway de conta

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 8.1 | Gerar snapshot OpenAPI e tipos de forma determinística | `[x]` | 358a685, b4e3500 (`gado-web`) | Dois ciclos idênticos; `contracts:check` verde; snapshot final preserva configuração real sem prefixo global |
| 8.2 | **RED**: cliente de conta, audiência, paths, erros e mapeamento | `[x]` | a178847 (`gado-web`) | `account-client.spec.ts` falha pela implementação ausente |
| 8.3 | **GREEN**: cliente central e gateway `gadoApp` | `[x]` | b4e3500 (`gado-web`) | Sem `fetch`/Axios/storage direto; validação fail-closed de payloads e operações tenant-aware |

**Task 8 concluída?** `[x]` | **Evidência:** spec focal 5/5, `contracts:check`, `check:network`, lint, typecheck completo e `build:app` verdes |

---

### Task 3.3: Autosserviço (frontend)

| # | Sub-item | Status | Commit | Arquivo(s) |
|---|---|---|---|---|
| 3.3.1 | Tela de conta da organização no `gado-app` | `[x]` | 95d2f7c / 09ec654 (`gado-web`) | Loading, dados públicos, status localizado e erro normalizado |
| 3.3.2 | Tela de fazendas no `gado-app` | `[x]` | d843f86 / 18c45a0 (`gado-web`) | Hierarquia, criação validada, seleção com token renovado, desativação confirmada e controles por permissão |
| 3.3.3 | Tela de equipe no `gado-app` | `[x]` | a083432, 97b3893 / c123166, ca7a4b0 (`gado-web`) | Resumo seguro, convites, vínculos, perfis customizados e controles por permissão |
| 3.3.4 | Tela de resumo da assinatura e limites no `gado-app` | `[x]` | 95d2f7c / 09ec654 (`gado-web`) | Plano, datas, limites e consumo somente leitura |
| 3.3.5 | **RED**: E2E — proprietário não tem rota/link/bundle/token aceito no `gado-admin` | `[x]` | eaf9956 (`gado-web`) | `admin-isolation.e2e.spec.ts`, router admin e rejeição fail-closed da sessão de proprietário |
| 3.3.6 | **GREEN**: isolamento confirmado | `[x]` | c7615a4 (`gado-web`) | 7/7 testes web, 5/5 testes backend de audiência, builds separados, bundles, rede, lint e tipos verdes |

**Task 3.3 concluída?** `[x]` | **Evidência:** Task 9 verde com 16/16 testes de páginas/router/layout; Task 10 RED `eaf9956`/GREEN `c7615a4`, 7/7 testes web e 5/5 testes backend de audiência; lint, typecheck, builds separados, contratos, rede e bundles verdes |

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
| 2026-09-18 01:09 | Codex GPT-5 | 02 | Onda 02 Task 2.3.15 | Onda 02 Task 2.3.16 | Checkpoint seguro após RED da API assíncrona; GREEN 2.3.16 ainda não iniciado |
| 2026-09-20 22:25 | Codex GPT-5 | 02 | Onda 02 Task 2.3.15 | Onda 02 Task 2.3.16 | GREEN focal, build, contrato e arquitetura passaram; integração bloqueada com segurança porque `TEST_DATABASE_URL` descartável está ausente |
| 2026-09-21 03:58 | Codex GPT-5 | 02 | Onda 02 Task 2.3.16 e Task 7A | Gate G1 lint | Integração descartável 2/2 e composição admin GREEN; gate global parou em 62 erros de lint preexistentes, sem deixar autofixes pendentes |
| 2026-09-21 09:13 | Codex GPT-5 | 02 | Onda 02 completa (G1 pass) | Onda 01 Task 1.1 | Lint, build, 147 unitários, arquitetura 23, contrato 9, integração 2, migrations 3, isolamento 8, coverage ≥80%, no-skipped e tipos verdes em banco descartável |
| 2026-09-22 00:50 | Codex GPT-5 | 01 | Onda 01 completa (G1-frontend pass) | Onda 03 Task 3.1.1 | CI, contratos, lint, tipos, arquitetura 7/7, coverage 62/62 ≥80%, builds, rede e bundles verdes; handoff criado |
| 2026-09-22 09:30 | Codex GPT-5 | 03 | Plano detalhado da Onda 03 criado | Onda 03 Task 3.1.1 RED | `main` de API e web enviadas ao remoto; implementação preservada como não iniciada; setup da worktree de plano bloqueado por `npm ci`/Windows e deve ser refeito antes do RED |
| 2026-09-22 10:05 | Codex GPT-5 | 03 | Onda 03 Task 3.1.1 | Onda 03 Task 3.1.2 continuação | CRUD/seleção especificados em `b64cdf2`; núcleo dos UseCases GREEN em `ef38e7a`; adapter Prisma, DTOs, controller e composição ainda pendentes |
| 2026-09-22 10:35 | Codex GPT-5 | 03 | Onda 03 Task 3.1.2 | Onda 03 Task 3.1.3 RED | Adapter transacional, DTOs camelCase validados, controller protegido e módulo DI concluídos; 166/166 unitários, arquitetura 23/23 e build verdes |
| 2026-09-22 11:00 | Codex GPT-5 | 03 | Onda 03 Task 3.1.3 | Onda 03 Task 3.1.4 continuação | Policy GREEN 8/8 em `fea521b`; `TEST_DATABASE_URL` descartável ausente, portanto migration/gate não foram iniciados nem contornados |
| 2026-09-22 11:45 | Codex GPT-5 | 03 | Onda 03 Task 3.1.4 | Onda 03 Task 3.1.5 RED | Banco temporário criado no servidor autorizado e removido após gates; migration limpa/upgrade 2/2, unitários 175/175, arquitetura 23/23 e build verdes |
| 2026-09-22 13:10 | Codex GPT-5 | 03 | Onda 03 Task 3.1 concluída | Onda 03 Task 3.2.1 RED | RED `5e704f5`, GREEN `2389b66`; isolamento 11/11, unitários 175/175, arquitetura 23/23 e build verdes; lint do escopo verde, lint global mantém 15 erros preexistentes da Task 3.1.4 |
| 2026-09-22 15:30 | Codex GPT-5 | 03 | Onda 03 Task 3.2.1–3.2.4 | Onda 03 Task 3.2.5 RED | Convites RED `df26ae5`/GREEN `f0cd00f`; limites RED `2b007d1`/GREEN `9c5e18f`; focais 14/14, unitários 189/189, arquitetura 23/23, build e migration admin descartável 1/1 verdes |
| 2026-09-22 18:00 | Codex GPT-5 | 03 | Onda 03 Task 3.2 concluída | Onda 03 Task 7 RED | Equipe/perfis RED `7c319f5`, `8967292`, `c6e54e1`; GREEN `4925021`, `e3785ea`, `b802230`; unitários 210/210, arquitetura 23/23, build e migration tenant descartável 2/2 verdes |
| 2026-09-22 | Codex GPT-5 | 03 | Onda 03 Task 7 concluída | Onda 03 Task 8 | Contrato RED `7dc7dae` e GREEN `6f07d51`; contrato 14/14, unitários 214/214, arquitetura 23/23, lint do escopo e build verdes |
| 2026-09-22 | Codex GPT-5 | 03 | Onda 03 Task 8 concluída | Onda 03 Task 9 RED | OpenAPI determinístico `358a685`; cliente RED `a178847`/GREEN `b4e3500`; spec 5/5, contratos, rede, lint, tipos e build do app verdes |
| 2026-09-22 20:15 | Codex GPT-5 | 03 | Onda 03 Task 9 concluída | Onda 03 Task 10 RED | Correção backend RED `ed658bd`/GREEN `805c797`, migrations 3/3 em banco filho removido; páginas RED `95d2f7c`, `d843f86`, `a083432`; GREEN `09ec654`, `18c45a0`, `ca7a4b0`; cliente de equipe RED `97b3893`/GREEN `c123166`; 16/16, lint, tipos, build, contratos e rede verdes |
| 2026-09-22 20:22 | Codex GPT-5 | 03 | Onda 03 Task 10 concluída | Onda 03 Task 11 / Gate G2-account | Isolamento RED `eaf9956`/GREEN `c7615a4`; 7/7 testes web, 5/5 testes backend de audiência, builds app/admin, bundles, rede, lint e tipos verdes |

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
