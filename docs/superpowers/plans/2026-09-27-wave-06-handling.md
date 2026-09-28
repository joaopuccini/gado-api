# Wave 06 Handling, Health, Photos, and Movements Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Entregar pastos/mapa, movimentos de pasto e lote, transferências entre fazendas, reprodução, vacinação e fotos com histórico completo, atomicidade, isolamento por tenant/fazenda e jornadas reais no `gado-app`.

**Architecture:** Substituir os CRUDs legados por módulos hexagonais em inglês, mantendo `Controller -> UseCase -> Port -> Adapter`. Movimentos usam uma porta explícita de unit of work para gravar histórico e posição atual na mesma transação Prisma. Fotos validam autorização antes de chamar uma porta de object storage; metadados persistidos não expõem caminho interno. Todas as consultas tenant-aware derivam o client do `ExecutionContextStore`, e o contrato público permanece `camelCase` e envelopado.

**Tech Stack:** NestJS 11, TypeScript, Prisma 7, PostgreSQL, Jest/Supertest, Swagger/OpenAPI, React 19, Vite, Vitest, Testing Library, Tailwind CSS, client central gerado.

**Worktrees:** `gado-api/.worktrees/wave-06-handling` e `gado-web/.worktrees/wave-06-handling`, ambos na branch `feat/wave-06-handling`.

**Context7 decisions:** usar transações interativas Prisma curtas, executando todas as queries pelo client transacional e deixando chamadas de storage fora da transação. Para multipart no NestJS, validar tamanho e MIME com `ParseFilePipe`/validators na fronteira e delegar persistência a uma porta injetável. O adapter de storage permanece configurável porque o repositório ainda não escolheu provedor.

## Regras de execução

- [ ] Não refazer Ondas 00–05.
- [ ] Cada comportamento novo começa em um commit RED observável e termina em commit GREEN separado.
- [ ] Não usar `prisma db push`, `migrate reset` nem banco/schema não descartável.
- [ ] Para migrations, criar banco filho temporário a partir da URL autorizada, executar os gates e removê-lo mesmo em falha.
- [ ] Não marcar task completa antes dos comandos de aceite listados nela.
- [ ] Atualizar `docs/testing/wave-06-handling.tdd.md` e `docs/handoffs/progress-tracker.md` após cada GREEN.
- [ ] Se uma integração externa falhar, limitar a investigação a evidências reproduzíveis e seguir para outra task independente; não criar loop de retries.

## Task 6.1 — Especificar e migrar o modelo persistente da onda

**Files:**

- Modify: `prisma/tenant/schema.prisma`
- Create: `prisma/tenant/migrations/202609270002_wave06_handling/migration.sql`
- Modify: `test/migrations/tenant-empty-schema.e2e-spec.ts`
- Modify: `test/migrations/tenant-upgrade.e2e-spec.ts`
- Create: `docs/testing/wave-06-handling.tdd.md`

### RED

- [ ] Escrever testes que exijam: pasto com GeoJSON e escopo de fazenda; movimentos com origem/destino, ator e timestamp; transferência entre fazendas; reprodução com tipo/status/ciclo; vacinação com protocolo, dose aplicada e próxima dose; foto com object key, MIME, tamanho e checksum.
- [ ] Exigir índices compostos por fazenda/animal/data e constraints que impeçam origem igual ao destino e valores inválidos.
- [ ] Rodar `npm run test:migrations -- --runInBand` contra banco filho descartável e registrar a falha pretendida.
- [ ] Commit: `test(handling): specify wave 06 persistence`

### GREEN

- [ ] Evoluir o schema sem editar migrations publicadas e escrever SQL versionado idempotente para upgrade.
- [ ] Preservar dados legados compatíveis; novos campos obrigatórios devem ter estratégia explícita de backfill/nullable-then-enforce.
- [ ] Rodar `npm run prisma:generate:tenant`, `npx prisma validate --schema prisma/tenant/schema.prisma` e os três cenários de migration em banco filho descartável.
- [ ] Commit: `feat(handling): migrate wave 06 persistence`

## Task 6.2 — Entregar pastos e mapa por arquitetura nova

**Files:**

- Delete: `src/pastos/pastos.controller.ts`
- Delete: `src/pastos/pastos.service.ts`
- Delete: `src/pastos/pastos.module.ts`
- Delete: `src/pastos/dto/pasto.dto.ts`
- Create: `src/handling/pastures/domain/pasture.ts`
- Create: `src/handling/pastures/application/ports/pasture.repository.ts`
- Create: `src/handling/pastures/application/use-cases/manage-pastures.use-case.ts`
- Create: `src/handling/pastures/application/use-cases/manage-pastures.use-case.spec.ts`
- Create: `src/handling/pastures/infrastructure/prisma-pasture.repository.ts`
- Create: `src/handling/pastures/infrastructure/prisma-pasture.repository.spec.ts`
- Create: `src/handling/pastures/presentation/dto/pasture.dto.ts`
- Create: `src/handling/pastures/presentation/pasture.controller.ts`
- Create: `src/handling/pastures/presentation/pasture.controller.spec.ts`
- Create: `src/handling/pastures/pastures.module.ts`
- Modify: `src/app.module.ts`
- Modify: `src/common/errors/error-catalog.ts`

### RED

- [ ] Especificar GeoJSON Polygon válido e fechado, área positiva, nomes não vazios e paginação envelopada.
- [ ] Especificar allow/deny para `pastos:ler` e `pastos:gerenciar`, escopo da fazenda selecionada e exclusão bloqueada quando houver animal ou histórico dependente.
- [ ] Commit: `test(pastures): specify secured pasture lifecycle`

### GREEN

- [ ] Implementar domínio puro, UseCase, repository Prisma contextual, DTOs `camelCase`, Swagger completo e controller sem regra de negócio.
- [ ] Manter rotas `/api/v1/pastures` como contrato novo; a rota legada `/pastos` só sai da quarentena depois do client migrado.
- [ ] Rodar focais, `npm run test:architecture -- --runInBand`, `npm run test:contract -- --runInBand`, `npm run lint:check` e `npm run build`.
- [ ] Commit: `feat(pastures): deliver secured pasture lifecycle`

## Task 6.3 — Tornar movimentos de pasto e lote atômicos

**Files:**

- Delete: `src/movimentacoes/*`
- Create: `src/handling/movements/domain/animal-movement.ts`
- Create: `src/handling/movements/application/ports/movement.unit-of-work.ts`
- Create: `src/handling/movements/application/use-cases/move-animal.use-case.ts`
- Create: `src/handling/movements/application/use-cases/move-animal.use-case.spec.ts`
- Create: `src/handling/movements/infrastructure/prisma-movement.unit-of-work.ts`
- Create: `src/handling/movements/infrastructure/prisma-movement.unit-of-work.spec.ts`
- Create: `src/handling/movements/presentation/dto/movement.dto.ts`
- Create: `src/handling/movements/presentation/movement.controller.ts`
- Create: `src/handling/movements/presentation/movement.controller.spec.ts`
- Create: `src/handling/movements/movements.module.ts`
- Create: `test/integration/atomic-animal-movement.integration-spec.ts`
- Modify: `src/app.module.ts`

### RED

- [ ] Especificar que origem vem do estado persistido do animal, nunca do body; destino deve pertencer à fazenda autorizada e ser diferente da origem.
- [ ] Provar rollback quando a escrita do histórico ou a atualização do animal falhar.
- [ ] Provar concorrência: duas movimentações simultâneas não podem criar uma cadeia de origem inconsistente.
- [ ] Commit: `test(movements): require atomic pasture and batch moves`

### GREEN

- [ ] Implementar unit of work Prisma com transação curta e isolamento suficiente para impedir lost update.
- [ ] Expor `POST /api/v1/animal-movements/pasture`, `POST /api/v1/animal-movements/batch` e histórico paginado.
- [ ] Rodar focais, integração descartável, arquitetura, contrato, lint e build.
- [ ] Commit: `feat(movements): move animals atomically`

## Task 6.4 — Transferir animais entre fazendas autorizadas

**Files:**

- Create: `src/handling/movements/application/use-cases/transfer-animal.use-case.ts`
- Create: `src/handling/movements/application/use-cases/transfer-animal.use-case.spec.ts`
- Modify: `src/handling/movements/application/ports/movement.unit-of-work.ts`
- Modify: `src/handling/movements/infrastructure/prisma-movement.unit-of-work.ts`
- Modify: `src/handling/movements/infrastructure/prisma-movement.unit-of-work.spec.ts`
- Modify: `src/handling/movements/presentation/dto/movement.dto.ts`
- Modify: `src/handling/movements/presentation/movement.controller.ts`
- Create: `test/isolation/animal-transfer-isolation.e2e-spec.ts`

### RED

- [ ] Exigir acesso simultâneo à fazenda de origem e destino via `accessibleFarmIds` verificado.
- [ ] Exigir lote e pasto de destino compatíveis, trilha com ator, manutenção do brinco no novo escopo e atomicidade de todas as escritas.
- [ ] Cobrir dois tenants, duas fazendas, destino negado e concorrência.
- [ ] Commit: `test(movements): specify authorized farm transfers`

### GREEN

- [ ] Implementar `POST /api/v1/animal-movements/farm-transfer` no mesmo unit of work.
- [ ] Rodar focais, isolamento descartável, arquitetura, contrato, lint e build.
- [ ] Commit: `feat(movements): transfer animals between farms`

## Task 6.5 — Modelar o ciclo reprodutivo

**Files:**

- Delete: `src/manejo/*`
- Create: `src/handling/reproduction/domain/reproductive-event.ts`
- Create: `src/handling/reproduction/domain/reproductive-event.spec.ts`
- Create: `src/handling/reproduction/application/ports/reproduction.repository.ts`
- Create: `src/handling/reproduction/application/use-cases/manage-reproduction.use-case.ts`
- Create: `src/handling/reproduction/application/use-cases/manage-reproduction.use-case.spec.ts`
- Create: `src/handling/reproduction/infrastructure/prisma-reproduction.repository.ts`
- Create: `src/handling/reproduction/infrastructure/prisma-reproduction.repository.spec.ts`
- Create: `src/handling/reproduction/presentation/dto/reproduction.dto.ts`
- Create: `src/handling/reproduction/presentation/reproduction.controller.ts`
- Create: `src/handling/reproduction/presentation/reproduction.controller.spec.ts`
- Create: `src/handling/reproduction/reproduction.module.ts`
- Modify: `src/app.module.ts`

### RED

- [ ] Especificar eventos `breeding`, `insemination`, `pregnancyDiagnosis`, `calving` e `cycleClosure` com transições válidas.
- [ ] Validar sexo, estado ativo, ordem de datas, touro opcional somente quando semântico e impossibilidade de dois ciclos abertos para a mesma matriz.
- [ ] Commit: `test(reproduction): specify reproductive cycle`

### GREEN

- [ ] Implementar domínio, persistência, DTOs, permissões `manejo:*`, Swagger e respostas paginadas.
- [ ] Rodar focais, arquitetura, contrato, lint e build.
- [ ] Commit: `feat(reproduction): deliver reproductive cycle`

## Task 6.6 — Entregar protocolos e aplicações de vacinação

**Files:**

- Delete: `src/vacinacao/*`
- Create: `src/health/vaccinations/domain/vaccination.ts`
- Create: `src/health/vaccinations/domain/vaccination.spec.ts`
- Create: `src/health/vaccinations/application/ports/vaccination.repository.ts`
- Create: `src/health/vaccinations/application/use-cases/manage-vaccinations.use-case.ts`
- Create: `src/health/vaccinations/application/use-cases/manage-vaccinations.use-case.spec.ts`
- Create: `src/health/vaccinations/infrastructure/prisma-vaccination.repository.ts`
- Create: `src/health/vaccinations/infrastructure/prisma-vaccination.repository.spec.ts`
- Create: `src/health/vaccinations/presentation/dto/vaccination.dto.ts`
- Create: `src/health/vaccinations/presentation/vaccination.controller.ts`
- Create: `src/health/vaccinations/presentation/vaccination.controller.spec.ts`
- Create: `src/health/vaccinations/vaccinations.module.ts`
- Modify: `src/app.module.ts`

### RED

- [ ] Especificar protocolo, aplicação individual/em lote, dose, unidade, data, próxima dose e alertas vencido/a vencer.
- [ ] Garantir que todos os animais de uma aplicação em lote pertençam à fazenda autorizada e que falha parcial reverta o lote inteiro.
- [ ] Commit: `test(vaccinations): specify schedules and applications`

### GREEN

- [ ] Implementar UseCases e adapter transacional, permissões `sanidade:*`, Swagger e listagem de alertas reais.
- [ ] Rodar focais, integração descartável, arquitetura, contrato, lint e build.
- [ ] Commit: `feat(vaccinations): deliver schedules and applications`

## Task 6.7 — Autorizar e armazenar fotos de animais

**Files:**

- Delete: `src/fotos/*`
- Create: `src/herd/photos/application/ports/animal-photo.repository.ts`
- Create: `src/herd/photos/application/ports/photo-storage.service.ts`
- Create: `src/herd/photos/application/use-cases/manage-animal-photos.use-case.ts`
- Create: `src/herd/photos/application/use-cases/manage-animal-photos.use-case.spec.ts`
- Create: `src/herd/photos/infrastructure/prisma-animal-photo.repository.ts`
- Create: `src/herd/photos/infrastructure/configured-photo-storage.service.ts`
- Create: `src/herd/photos/infrastructure/configured-photo-storage.service.spec.ts`
- Create: `src/herd/photos/presentation/dto/photo.dto.ts`
- Create: `src/herd/photos/presentation/animal-photo.controller.ts`
- Create: `src/herd/photos/presentation/animal-photo.controller.spec.ts`
- Create: `src/herd/photos/animal-photos.module.ts`
- Modify: `src/app.module.ts`

### RED

- [ ] Especificar que animal/fazenda/permissão são validados antes da primeira chamada ao storage.
- [ ] Validar JPEG/PNG/WebP, limite de tamanho, checksum e object key gerado pelo servidor, sem confiar em filename/caminho do cliente.
- [ ] Cobrir compensação: apagar objeto quando metadados falharem; ao excluir, manter metadado até storage confirmar ou registrar estado de retry.
- [ ] Commit: `test(photos): specify authorized object storage flow`

### GREEN

- [ ] Implementar porta provider-agnostic, adapter configurável e fake injetável para testes; nenhum SDK vaza ao UseCase.
- [ ] Implementar multipart com validators NestJS e controller que só traduz transporte.
- [ ] Rodar focais, arquitetura, contrato, lint e build.
- [ ] Commit: `feat(photos): deliver authorized animal storage`

## Task 6.8 — Publicar OpenAPI e client central da Onda 06

**Files:**

- Modify: `test/contracts/openapi.e2e-spec.ts`
- Modify: `test/fixtures/legacy-route-quarantine.json`
- Modify: `gado-web/packages/contracts/openapi/gado-api.json`
- Modify: `gado-web/packages/contracts/src/generated/gado-api.ts`
- Create: `gado-web/packages/api-client/src/handling-client.ts`
- Create: `gado-web/packages/api-client/src/handling-client.spec.ts`
- Modify: `gado-web/packages/api-client/src/index.ts`
- Modify: `gado-web/apps/gado-app/src/services/operational-gateway.ts`
- Modify: `gado-web/apps/gado-app/src/services/operational-gateway.spec.ts`

### RED

- [ ] Fixar schemas, operationIds, envelopes e erros de todas as rotas novas no teste de contrato.
- [ ] Especificar `HandlingClient` fail-closed e provar que o gateway temporário não faz parsing ad hoc de pastos.
- [ ] Commit API: `test(handling): specify public wave 06 contract`
- [ ] Commit Web: `test(handling): specify generated handling client`

### GREEN

- [ ] Gerar snapshot OpenAPI determinístico e tipos; implementar client central sem `fetch`/Axios fora do pacote.
- [ ] Remover as rotas legadas substituídas da composition root e da quarentena somente após equivalência do contrato.
- [ ] Rodar API contrato/build e Web `contracts:check`, client focal, `check:network`, lint e typecheck.
- [ ] Commit API: `feat(handling): publish wave 06 contract`
- [ ] Commit Web: `feat(handling): consume generated handling contract`

## Task 6.9 — Migrar as jornadas para o `gado-app`

**Files:**

- Modify: `gado-web/apps/gado-app/src/app/app-router.tsx`
- Modify: `gado-web/apps/gado-app/src/app/app-router.spec.tsx`
- Modify: `gado-web/apps/gado-app/src/layouts/operational-layout.tsx`
- Modify: `gado-web/apps/gado-app/src/layouts/operational-layout.spec.tsx`
- Modify: `gado-web/apps/gado-app/src/pages/farm-map-page.tsx`
- Modify: `gado-web/apps/gado-app/src/pages/farm-map-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/handling/pages/movements-page.tsx`
- Create: `gado-web/apps/gado-app/src/features/handling/pages/movements-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/handling/pages/reproduction-page.tsx`
- Create: `gado-web/apps/gado-app/src/features/handling/pages/reproduction-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/health/pages/vaccinations-page.tsx`
- Create: `gado-web/apps/gado-app/src/features/health/pages/vaccinations-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/herd/components/animal-photos.tsx`
- Create: `gado-web/apps/gado-app/src/features/herd/components/animal-photos.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/handling/handling-journey.e2e.spec.tsx`

### RED

- [ ] Especificar loading, vazio, erro, sucesso e sem permissão para cada jornada.
- [ ] Provar mapa com criação/edição real, movimentos refletidos no animal, calendário sanitário, ciclo reprodutivo e upload após autorização.
- [ ] Commit: `test(handling): specify operational journeys`

### GREEN

- [ ] Implementar páginas responsivas e acessíveis usando somente o `HandlingClient` central.
- [ ] Ocultar ações por permissão sem tratar isso como autorização real.
- [ ] Rodar focais/E2E, arquitetura, contratos, rede, lint, typecheck e `build:app`.
- [ ] Commit: `feat(handling): deliver operational journeys`

## Task 6.10 — Isolamento, reconciliação e Gate G5-handling

**Files:**

- Create: `test/isolation/handling-isolation.e2e-spec.ts`
- Create: `test/integration/handling-reconciliation.integration-spec.ts`
- Modify: `docs/testing/wave-06-handling.tdd.md`
- Modify: `docs/handoffs/progress-tracker.md`
- Create: `docs/handoffs/2026-09-27-wave-06-complete.md`

### RED de reconciliação

- [ ] Criar fixture conhecida com pastos, lotes, duas fazendas, movimentos, ciclo reprodutivo, vacinação e foto fake.
- [ ] Demonstrar que o teste falha se histórico divergir da posição atual ou se storage for chamado antes da autorização.
- [ ] Commit: `test(handling): reconcile atomic operational fixture`

### GREEN e gates finais

- [ ] Corrigir somente divergências reveladas pela reconciliação e registrar tolerâncias/decisões.
- [ ] API: `npm run lint:check`, `npm run build`, unit, architecture, contract, integration, isolation, migrations, coverage e no-skipped.
- [ ] Web: `npm run contracts:check`, `npm run lint`, `npm run typecheck`, architecture, coverage com worker limitado se necessário, `build:app`, `build:admin`, network e bundles.
- [ ] Confirmar cobertura global e da mudança >= 80%, nenhum skipped e nenhum banco filho restante.
- [ ] Atualizar tracker/handoff somente depois de todos os gates verdes.
- [ ] Commit: `docs(handling): close wave 06 gate`

## Gate G5-handling

- [ ] Movimento de pasto/lote/fazenda nunca deixa histórico e posição atual divergentes.
- [ ] Dois tenants e duas fazendas permanecem isolados sob concorrência.
- [ ] Reprodução rejeita sexo, estado, data e transição inválidos.
- [ ] Vacinação produz próxima dose e alertas a partir de dados persistidos.
- [ ] Storage nunca recebe arquivo antes da autorização e falhas não deixam objeto/metadado órfão sem estado recuperável.
- [ ] OpenAPI, client gerado e jornadas web concordam.
- [ ] Todas as migrations passam em criação limpa, upgrade e provisionamento descartável.
- [ ] Gates completos da API e dos dois frontends estão verdes.
