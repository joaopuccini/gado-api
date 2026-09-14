# Gado SaaS Master Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todas as capacidades aprovadas dos quatro sistemas legados para `gado-api` e para as aplicações independentes `gado-app` e `gado-admin`, com isolamento SaaS, arquitetura hexagonal, TDD e desligamento reconciliado dos legados.

**Architecture:** O backend será um monólito modular NestJS com fluxo `Controller -> UseCase -> Port -> Adapter`, contexto único por `AsyncLocalStorage` e persistência PostgreSQL normalizada. O frontend continuará no repositório `gado-web`, organizado como workspace com dois builds independentes e pacotes compartilhados de contratos, autenticação, UI e client HTTP.

**Tech Stack:** NestJS 11, TypeScript, Prisma 7, PostgreSQL/Neon, React 19, Vite 8, Tailwind CSS, Jest, Supertest, Testing Library, Vitest e Playwright.

---

## 1. Autoridade, escopo e modelo de execução

Este plano executa o design `docs/superpowers/specs/2026-09-11-arquitetura-migracao-saas-design.md` e a lei `.agent/rules/gado-saas-engineering.md`. Em caso de divergência, a Rule é obrigatória e o design deve ser revisado antes de alterar código.

O programa é grande demais para uma única mudança segura. Este documento define dependências, ordem, gates e aceite do programa. Cada onda possui um plano de implementação TDD próprio, revisado imediatamente antes da execução. O primeiro plano detalhado já acompanha este documento:

- `docs/superpowers/plans/2026-09-12-wave-00-backend-foundation.md`

Regras de execução:

1. Uma onda só começa quando todas as dependências e gates anteriores estão verdes.
2. Cada caso de uso segue RED -> commit de teste -> GREEN -> commit de implementação -> refactor opcional -> evidência.
3. Cada repositório recebe commits próprios; uma operação nunca mistura o Git de `gado-api` com o Git de `gado-web`.
4. Código novo ou alterado mantém cobertura mínima de 80% em branches, functions, lines e statements. A cobertura global nunca pode diminuir e deve alcançar 80% antes do desligamento dos legados.
5. Cada onda atualiza `docs/testing/<onda>.tdd.md` com comandos e resultados realmente executados.
6. Não existem mocks em produção, rotas sem autenticação por conveniência, fallback de tenant, `db push` produtivo ou aceite baseado apenas em compilação.

## 2. Linhas de base conhecidas

| Área | Estado inicial confirmado | Consequência no plano |
|---|---|---|
| Testes backend | Jest; 12 testes unitários concentrados em tenant middleware e animais | A Onda 00 instala gates por camada e caracteriza comportamento antes de refatorar |
| Testes frontend | Nenhum runner ou suite configurado | A Onda 01 instala Vitest/Testing Library e Playwright antes de migrar telas |
| Contexto | Dois `AsyncLocalStorage` independentes | A Onda 00 os substitui por um único contexto de execução |
| Tenant | Middleware decodifica JWT sem verificar e aceita fallbacks | A Onda 00 remove autoridade não verificada e impõe falha fechada |
| Prisma tenant | Reescrita textual de SQL, client default e singleton global | Um spike bloqueante valida a estratégia de schema antes da substituição |
| Erros | Dois filtros concorrentes e dois contratos incompatíveis | A Onda 00 mantém um filtro e um contrato `camelCase` |
| Logging | Três loggers/interceptor textual e `console.*` | A Onda 00 cria logger JSON e interceptor global único |
| Migrations | Não há migrations versionadas | A Onda 00 cria cadeias administrativa e tenant reproduzíveis |
| Swagger | Parcial e sem gate de completude | Cada módulo só migra com OpenAPI completo e teste de contrato |
| Frontend | Admin e operacional misturados em uma SPA | A Onda 01 cria dois apps e dois deploys sem compartilhar rotas |

## 3. Grafo de dependências

```text
Onda 00 — fundações backend
  ├── Onda 01 — workspace frontend
  └── Onda 02 — identidade, RBAC e provisionamento
        └── Onda 03 — conta, fazendas, equipe e assinatura
              ├── Onda 04 — rebanho básico
              │     └── Onda 05 — pesagens e dashboard real
              │           └── Onda 06 — manejo, sanidade, fotos e movimentações
              └── Onda 07 — parceiros, vendas, custos, caixa e ledger
                    └── Onda 08 — administração interna SaaS e billing

Ondas 04–08 verdes
  -> Onda 09 — ETL, reconciliação e operação paralela
  -> Onda 10 — cutover e desligamento dos legados
  -> Onda 11 — módulos novos de suprimentos, frota e expansão
```

As Ondas 04 e 07 podem ser executadas em paralelo somente depois da Onda 03. A Onda 08 pode preparar telas internas em paralelo, mas não entra em produção antes de identidade, billing e provisionamento estarem verdes.

## 4. Registro executável das ondas

| Onda | Resultado utilizável | Dependências | Gate de saída |
|---|---|---|---|
| 00 | Fundação backend segura e reproduzível | Design aprovado | Contexto concorrente, erros, logs, contratos, migrations e CI verdes |
| 01 | `gado-app` e `gado-admin` com builds/testes independentes | Contrato da Onda 00 | Nenhum código admin no bundle cliente; client HTTP único |
| 02 | Login, seleção, RBAC e onboarding idempotente | 00 e shell 01 | Tenant só fica ativo após migrations/smoke; admin e cliente isolados |
| 03 | Fazendas, hierarquia, usuários, convites, conta e assinatura | 02 | Proprietário realiza autosserviço sem acessar `gado-admin` |
| 04 | Animais, raças e lotes com paridade aprovada | 03 | Fluxo vertical E2E, dois tenants e duas fazendas |
| 05 | Pesagens e dashboard zootécnico sem mocks | 04 | Indicadores reconciliados com dados conhecidos |
| 06 | Pastos, movimentos, reprodução, vacinação e fotos | 04 e 05 | Atualizações atômicas e histórico completo |
| 07 | Parceiros, vendas, custos, caixa e ledger | 03 e 04 | Compra/venda/custo/estorno reconciliados contabilmente |
| 08 | Operação interna de organizações, planos, assinaturas e pagamentos | 02, 03 e 07 | Somente `AdminUser`; dashboard SaaS com dados reais |
| 09 | Migração repetível dos dados de cada cliente | 04–08 | Contagens, totais e amostras reconciliados por tenant |
| 10 | Legados somente leitura e depois desligados | 09 | Janela observada sem divergência crítica ou perda |
| 11 | Suprimentos, financeiro avançado e frota | 10 | Cada módulo nasce sob a arquitetura nova; nenhum esqueleto vazio |

## 5. Onda 00 — fundações backend

Plano detalhado: `docs/superpowers/plans/2026-09-12-wave-00-backend-foundation.md`.

Entregas obrigatórias:

- spike de isolamento com Prisma e schemas dinâmicos, sem reescrita textual de SQL;
- ADR da estratégia de persistência e ADR de quarentena do legado;
- contexto único `ExecutionContextStore` baseado em `AsyncLocalStorage`;
- autenticação como única fonte de claims e validação do tenant contra o registry;
- client tenant fail-closed, sem default, singleton global ou seleção manual de schema;
- logger JSON com redaction e correlação automática;
- `LoggingInterceptor`, `ResponseEnvelopeInterceptor`, `GlobalValidationPipe` e `GlobalExceptionFilter` registrados por `APP_*`;
- erros de domínio e envelopes de API estritamente `camelCase`;
- cadeia versionada de migrations para admin e tenants;
- testes unitários, integração PostgreSQL, concorrência multi-tenant, contrato e arquitetura;
- CI com build, lint sem escrita, testes, coverage, OpenAPI e migrations.

Gate `G0`:

**Status: concluído em 2026-09-14.** Evidências auditáveis em `docs/testing/wave-00-backend-foundation.tdd.md`.

```text
contextConcurrency = pass
missingTenantFailsClosed = pass
unknownErrorHasNoLeak = pass
logsAreStructuredAndRedacted = pass
openApiContract = pass
emptyDatabaseMigration = pass
previousVersionUpgrade = pass
newTenantProvisioning = pass
foundationCoverage = 96.35% statements / 84.21% branches / 100% functions / 97.82% lines
```

## 6. Onda 01 — dois frontends e plataforma compartilhada

### Task 1.1: Criar workspace e builds independentes

**Destino:** `gado-web`

**Arquivos principais:**

- criar `apps/gado-app/src/main.tsx` e `apps/gado-app/vite.config.ts`;
- criar `apps/gado-admin/src/main.tsx` e `apps/gado-admin/vite.config.ts`;
- criar `packages/ui`, `packages/api-client`, `packages/contracts`, `packages/auth` e `packages/config`;
- modificar `package.json`, `package-lock.json`, `tsconfig.json` e scripts de CI;
- remover `src/App.tsx` depois que os dois apps reproduzirem suas rotas legítimas.

TDD/aceite:

- [ ] Escrever teste que falha quando o grafo de imports do `gado-app` alcança qualquer arquivo de `gado-admin`.
- [ ] Escrever smoke tests separados para `/login` do cliente e `/login` administrativo.
- [ ] Criar os workspaces e mover somente o shell necessário para deixar os testes verdes.
- [ ] Executar `npm run build:app` e `npm run build:admin`; ambos devem gerar diretórios distintos.
- [ ] Registrar RED/GREEN em `docs/testing/wave-01-frontend-platform.tdd.md`.

### Task 1.2: Criar contratos, HTTP e sessão compartilhados

- [ ] Gerar tipos a partir do OpenAPI aprovado, sem tipos escritos manualmente em páginas.
- [ ] Testar e implementar client HTTP central com token, requestId, tenant validado e parser dos envelopes globais.
- [ ] Testar expiração, logout, `401`, `403`, validação `400` e indisponibilidade `500`.
- [ ] Implementar route guards visuais; manter autorização real exclusivamente no backend.
- [ ] Proibir `axios.create` e chamadas diretas fora de `packages/api-client` por regra de lint.

Gate `G1-frontend`: os dois apps fazem build e testes independentes, o admin não está no bundle cliente e nenhuma tela usa API mockada.

## 7. Onda 02 — identidade, RBAC e provisionamento

### Task 2.1: Identidades e audiences

- [ ] Modelar e migrar `AdminUser`, `UsuarioGlobal`, `AcessoOrganizacao`, `Usuario` e `UsuarioFazenda` sem duplicar responsabilidades.
- [ ] Escrever testes RED para rejeitar token operacional em `/api/v1/admin/*` e token admin em dados tenant.
- [ ] Implementar login administrativo e operacional por UseCases separados.
- [ ] Validar `aud`, expiração, organização, tenant, fazenda e revogação antes de enriquecer o contexto.
- [ ] Aplicar permissions por decorator/guard em todas as rotas migradas.

### Task 2.2: Provisionamento idempotente

- [ ] Criar testes do state machine `registered -> provisioningSchema -> applyingMigrations -> seeding -> validating -> active`.
- [ ] Criar `ProvisioningRun` e etapas persistidas no admin.
- [ ] Implementar criação de schema, migrations, seeds, usuário local, fazenda principal e smoke queries.
- [ ] Implementar outbox de onboarding e adapter SES; nenhum e-mail ocorre antes do commit.
- [ ] Testar retry após falha em cada etapa e garantir que recursos concluídos não sejam duplicados.
- [ ] Retornar `202` e endpoint de status até o tenant estar `active`.

Gate `G1-identity`: cadastro por e-mail e Google produzem o mesmo estado final; falhas são retomáveis; o token só é emitido para tenant ativo.

## 8. Onda 03 — conta, fazendas, equipe e assinatura

### Task 3.1: Fazendas e hierarquia

- [ ] Migrar criação, edição, seleção, matriz/filiais e escopo de acesso por fazenda.
- [ ] Substituir `HierarchyInterceptor` por policy/UseCase que consulta a hierarquia explicitamente antes do repository operacional.
- [ ] Testar que pai autorizado vê filhas permitidas e nunca vê fazenda de outro tenant.

### Task 3.2: Equipe e perfis

- [ ] Implementar convite, aceite, expiração, reenvio, revogação e limites do plano.
- [ ] Implementar atribuição de perfis/permissões e vínculo `UsuarioFazenda`.
- [ ] Cobrir allow/deny para proprietário, gerente, operador e visualizador.

### Task 3.3: Autosserviço

- [ ] Implementar conta da organização, fazendas, equipe, resumo da assinatura e limites no `gado-app`.
- [ ] Garantir por E2E que proprietário não possui rota, link, bundle nem token aceito no `gado-admin`.

Gate `G2-account`: proprietário administra sua organização pelo `gado-app`; suporte interno usa somente `gado-admin`.

## 9. Onda 04 — rebanho básico

### Task 4.1: Raças e lotes

- [ ] Catalogar regras de `RouteRacas.js` e `RouteLotes.js` como testes de aceite.
- [ ] Migrar CRUD por UseCases, contratos paginados, dependências de exclusão e Swagger completo.
- [ ] Criar páginas no `gado-app` com vazio, loading, erro, sucesso e sem permissão.

### Task 4.2: Animais

- [ ] Fixar contrato `camelCase` e mappings explícitos entre DTO, domínio e Prisma.
- [ ] Migrar criação, compra, listagem, detalhe, edição e baixa sem DTO direto no ORM.
- [ ] Tornar compra + animal + lançamento financeiro uma transação.
- [ ] Testar unicidade do brinco no escopo correto, sexo/status, vínculos e acesso por fazenda.
- [ ] Entregar jornada E2E login -> selecionar fazenda -> cadastrar -> consultar animal.

Gate `G3-herd`: paridade aprovada, contrato gerado consumido no frontend e isolamento concorrente comprovado.

## 10. Onda 05 — pesagens e dashboard real

- [ ] Criar módulo hexagonal `pesagens`, ausente no backend atual.
- [ ] Testar registro, correção auditável, evolução de peso e limites de data/medida.
- [ ] Implementar indicadores de ganho médio, distribuição por lote/pasto e alertas calculados.
- [ ] Migrar o indicador CEPEA por Gateway externo com timeout, cache, observabilidade e fallback para o último valor válido.
- [ ] Remover todos os mocks do dashboard operacional.
- [ ] Reconciliar uma massa conhecida com os cálculos do legado e registrar tolerâncias decimais.

Gate `G4-metrics`: dashboard deriva exclusivamente de dados persistidos e os cálculos possuem testes unitários de borda.

## 11. Onda 06 — manejo, sanidade, fotos e movimentações

| Capacidade | Invariantes mínimas |
|---|---|
| Pastos/mapa | GeoJSON válido, escopo da fazenda, edição e exclusão protegida por dependências |
| Movimento de pasto | Histórico com origem/destino e atualização atômica do animal |
| Movimento de lote | Histórico e lote atual alterados na mesma transação |
| Transferência entre fazendas | Destino autorizado, catálogos compatíveis, trilha e atomicidade |
| Reprodução | Regras de sexo, datas, ciclo e status coerentes |
| Vacinação | Calendário, aplicação, próxima dose e alertas reais |
| Fotos | Storage por Gateway, metadados no banco e autorização por animal/fazenda |

Para cada linha:

- [ ] Escrever testes de domínio, integração e isolamento antes do UseCase.
- [ ] Implementar ports/adapters e contrato Swagger.
- [ ] Migrar a jornada correspondente do `gado-front-end` para `gado-app`.
- [ ] Registrar reconciliação e evidência TDD.

Gate `G5-handling`: nenhuma movimentação altera somente histórico ou somente posição atual; storage não recebe arquivo sem autorização.

## 12. Onda 07 — parceiros, comercial e financeiro

### Task 7.1: Clientes/parceiros e categorias

- [ ] Definir explicitamente catálogos compartilhados pela organização e acessos por fazenda.
- [ ] Migrar clientes/parceiros, categorias de custo e seus CRUDs completos.

### Task 7.2: Ledger e caixa

- [ ] Modelar lançamentos imutáveis com `Decimal`, direção, origem, competência e estorno compensatório.
- [ ] Testar saldo como soma assinada de lançamentos, nunca soma indiferenciada.
- [ ] Impedir update/delete contábil; correção gera estorno e novo lançamento.

### Task 7.3: Custos

- [ ] Testar criação do custo, rateio exato por animal, arredondamento, saída e estorno.
- [ ] Executar todas as escritas na mesma transação e publicar efeitos externos por outbox.

### Task 7.4: Vendas

- [ ] Testar itens, custo acumulado, lucro, mudança de status dos animais, entrada e cancelamento.
- [ ] Garantir reversão compensatória atômica e idempotência.

Gate `G6-finance`: totais por tenant reconciliados com fixtures do legado; nenhuma operação produz saldo parcial.

## 13. Onda 08 — `gado-admin` interno e billing

- [ ] Implementar autenticação administrativa independente e `AdminGuard` em toda rota `/api/v1/admin/*`.
- [ ] Migrar organizações, planos, benefícios/limites, assinaturas, pagamentos e administradores.
- [ ] Implementar bloqueio/desbloqueio atômico entre organização, assinatura e tenant registry.
- [ ] Implementar dashboard real de tenants, trials, MRR, churn, inadimplência e provisionamentos.
- [ ] Implementar auditoria e reprocessamento idempotente de provisionamento.
- [ ] Expor no `gado-app` apenas o autosserviço da própria organização.
- [ ] Provar por E2E que usuário cliente recebe `401/403` em todos os endpoints administrativos.

Gate `G7-admin`: zero endpoint admin anônimo/operacional e zero KPI mockado.

## 14. Onda 09 — ETL e reconciliação por tenant

### Task 9.1: Manifesto de migração

Para cada tenant, criar um manifesto imutável com origem, versão, checksums, contagens e totais financeiros. A unidade de execução será sempre um tenant completo.

- [ ] Extrair sem modificar os bancos legados.
- [ ] Transformar nomes legados para contratos internos `camelCase` e relações normalizadas.
- [ ] Carregar em staging tenant e executar constraints/smoke tests.
- [ ] Reconciliar contagens por entidade, vínculos órfãos, brinco, pesos e totais financeiros.
- [ ] Produzir relatório assinado como `docs/migration-evidence/<tenantId>.md`.

### Task 9.2: Operação paralela

- [ ] Colocar o módulo legado em read-only somente depois do aceite da carga.
- [ ] Executar comparação diária de dados e métricas durante a janela definida para o cliente.
- [ ] Reabrir escrita legada somente pelo procedimento formal de rollback.

Gate `G8-data`: discrepâncias críticas iguais a zero e divergências toleradas explicitamente justificadas no relatório.

## 15. Onda 10 — cutover e desligamento

- [ ] Validar backup restaurável e rollback ensaiado antes de cada cutover.
- [ ] Trocar tráfego por tenant/capacidade, nunca por big bang global.
- [ ] Observar erros, latência, filas, reconciliação e chamados após a troca.
- [ ] Revogar escrita, secrets e deploy dos legados depois da janela aceita.
- [ ] Preservar bancos legados read-only pelo prazo de retenção aprovado.
- [ ] Classificar cada módulo como `migrated`, `replaced` ou `formallyDiscontinued`.

Gate `G9-cutover`: os quatro projetos legados deixam de servir produção sem perda, regressão aceita ou dependência operacional oculta.

## 16. Onda 11 — expansão pós-paridade

Somente após `G9-cutover`:

- suprimentos: almoxarifados, produtos, fornecedores, pedidos e estoque;
- financeiro avançado: contas bancárias, pagar, receber e transações;
- frota: safras, máquinas, abastecimentos e manutenções;
- integrações adicionais aprovadas depois da paridade.

Os 13 controllers vazios atuais não contam como avanço. Cada capacidade começa por jornada, teste RED, domínio, ports/adapters, API/OpenAPI, interface e E2E.

## 17. Matriz final de migração dos módulos legados

| Legado | Destino backend | Destino frontend | Onda |
|---|---|---|---|
| Login/seleção | identity-access/fazendas | gado-app | 02–03 |
| Animais/raças/lotes | rebanho | gado-app | 04 |
| Pesagens | rebanho/pesagens | gado-app | 05 |
| Dashboard operacional | dashboard/read models | gado-app | 05 |
| Pastos/mapa | fazendas/manejo | gado-app | 06 |
| Reprodução/vacinação/fotos | manejo | gado-app | 06 |
| Movimentos de pasto/lote/fazenda | manejo | gado-app | 06 |
| Clientes/parceiros | comercial | gado-app | 07 |
| Categorias/custos/rateio | financeiro | gado-app | 07 |
| Venda/itens/lucro | comercial + financeiro | gado-app | 07 |
| Caixa | financeiro/ledger | gado-app | 07 |
| Cadastro público/onboarding | identity-access + provisioning | gado-app | 02 |
| Usuários da fazenda/perfis | identity-access | gado-app | 03 |
| Organizações/tenants | admin + provisioning | gado-admin | 08 |
| Planos/assinaturas/pagamentos | admin/billing | gado-admin; resumo no gado-app | 08 |
| Administradores/suporte | admin/identity | gado-admin | 08 |
| Dashboard SaaS | admin/read models | gado-admin | 08 |
| E-mail de onboarding | notifications/SES | sem tela; status nos dois apps | 02 |
| CEPEA | integrations/market-price | gado-app | 05 |
| Reset de banco | não migra | não migra | substituído por migrations |

## 18. Rastreabilidade das premissas aprovadas

| Premissa do design/Rule | Implementação principal | Evidência obrigatória |
|---|---|---|
| `AsyncLocalStorage` único e tenant fail-closed | Onda 00, Tasks 2, 6 e 8 | Unit + concorrência E2E + isolamento PostgreSQL |
| Logs JSON ponta a ponta | Onda 00, Task 4 | Unit de redaction + contrato do interceptor |
| Filtro e domínio único de erros | Onda 00, Task 3 | Unit + contrato HTTP de falha conhecida/desconhecida |
| API e erros `camelCase` | Onda 00, Tasks 3, 5 e 10; todas as ondas | OpenAPI + contrato + client gerado |
| Banco normalizado e migrations | Onda 00, Tasks 7–9; cada onda funcional | Vazio + upgrade + tenant novo + reconciliação |
| `Controller -> UseCase -> Port -> Adapter` | Onda 00, Task 10; todas as ondas | Teste arquitetural e unitários sem framework |
| DTO/class-validator/pipe global | Onda 00, Task 5; cada endpoint migrado | Unit do pipe + E2E de input inválido |
| Swagger vivo e completo | Onda 00, Task 10; cada endpoint migrado | OpenAPI completeness test |
| `gado-app` e `gado-admin` separados | Onda 01 | Dois builds + teste de grafo de imports |
| Admin exclusivamente interno | Ondas 02, 03 e 08 | E2E cruzado de audiences e `401/403` |
| Onboarding idempotente | Onda 02 | Falha/retry em cada estado + smoke de schema |
| Paridade e desligamento seguro | Ondas 04–10 | Relatórios por módulo/tenant + janela paralela |
| TDD mínimo de 80% | Todas as ondas | Commits RED/GREEN + coverage + relatório TDD |

## 19. Definition of Ready de uma onda

Antes de criar código:

- [ ] comportamentos legados da onda foram transformados em jornadas e critérios de aceite;
- [ ] tabelas, constraints, transações e ownership de dados foram revisados;
- [ ] endpoints e envelopes foram desenhados em `camelCase`;
- [ ] permissões allow/deny e escopos tenant/fazenda estão explícitos;
- [ ] paths exatos de criação/modificação/teste constam no plano da onda;
- [ ] comandos RED, GREEN, coverage e E2E constam no plano;
- [ ] rollback e reconciliação estão definidos quando houver dados produtivos.

## 20. Definition of Done de uma onda

- [ ] RED observado pela falha pretendida e commitado;
- [ ] GREEN observado no mesmo alvo e commitado;
- [ ] unit, integration, isolation, contract e E2E pertinentes passam;
- [ ] coverage da mudança é no mínimo 80% e cobertura global não cai;
- [ ] OpenAPI e client frontend gerado concordam;
- [ ] logs permitem rastrear request, tenant, fazenda, operação e duração sem segredo;
- [ ] migrations passam em banco vazio, upgrade e novo tenant;
- [ ] documentação funcional e relatório TDD estão atualizados;
- [ ] módulo legado correspondente está marcado com o próximo estado de cutover.

## 21. Comandos de verificação do programa

Backend, depois que a Onda 00 instalar todos os scripts:

```powershell
cd gado-api
npm ci
npm run lint:check
npm run build
npm run test:unit -- --runInBand
npm run test:integration -- --runInBand
npm run test:architecture -- --runInBand
npm run test:contract -- --runInBand
npm run test:isolation -- --runInBand
npm run test:cov -- --runInBand
```

Frontend, depois que a Onda 01 instalar o workspace:

```powershell
cd gado-web
npm ci
npm run lint
npm run typecheck
npm run test -- --run
npm run build:app
npm run build:admin
npm run test:e2e
```

Resultados esperados: exit code `0`, nenhum teste skipped, cobertura da mudança igual ou superior a 80%, dois builds independentes e nenhum contrato OpenAPI divergente.
