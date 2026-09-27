# Onda 05 — Pesagens e dashboard real

> **Execução:** usar `superpowers:executing-plans`, uma task por vez, sempre
> RED -> commit de teste -> GREEN -> commit de implementação -> gates.

**Objetivo:** entregar pesagens auditáveis e um dashboard zootécnico derivado
somente de dados persistidos, com indicador CEPEA resiliente e sem adapters ou
mocks legados em produção.

**Arquitetura:** `Controller -> UseCase -> Port -> Adapter`, contexto tenant
obrigatório e escopo da fazenda em toda consulta. Pesagens corrigidas nunca são
apagadas: uma nova revisão referencia a anterior e a invalidação ocorre na
mesma transação que recalcula `Animal.pesoAtual`. O dashboard usa um read model
tenant-aware. O preço CEPEA passa por gateway externo com timeout e por cache
durável no schema administrativo, sem compartilhar dados operacionais entre
tenants.

**Stack:** NestJS 11, Prisma 7, PostgreSQL/Neon, TypeScript, React 19, Vitest,
Jest e `fetch` nativo encapsulado por port. A documentação NestJS 11 consultada
via Context7 confirma timeout/interceptação observável para clientes HTTP e TTL
em milissegundos para caches; esta onda mantém essas decisões atrás de ports.

## Decisões e critérios fixados

- `peso` usa `Decimal(10,3)`, deve ser maior que zero e no máximo 3000 kg;
- `dataPesagem` não pode estar no futuro nem anteceder a entrada do animal;
- registro/correção e atualização de `Animal.pesoAtual` são atômicos;
- correção cria nova linha, referencia `corrigePesagemId`, exige motivo e
  preserva a linha anterior com `ativa=false`;
- o peso atual é a pesagem ativa mais recente por `dataPesagem`, desempate por
  `id`; corrigir histórico não substitui indevidamente o peso atual;
- GMD de cada animal é `(últimoPeso - primeiroPeso) / dias`, usando somente
  pesagens ativas e intervalo positivo; o indicador agregado é a média dos GMDs
  válidos, arredondada a 3 casas;
- distribuições por lote e pasto incluem quantidade e peso médio dos animais
  ativos da fazenda;
- alertas: sem pesagem, última pesagem há mais de 30 dias e perda entre as duas
  últimas pesagens ativas;
- CEPEA: timeout de 2 s, TTL fresco de 6 h, valor positivo validado, cache
  durável global; falha usa o último valor válido com `freshness=stale`; sem
  cache anterior retorna indicador `null` sem derrubar o dashboard;
- contrato público exclusivamente camelCase; dinheiro e medidas saem como
  números validados, sem tipos Prisma no controller;
- permissões: `pesagens:ler`, `pesagens:criar`, `pesagens:gerenciar` e
  `dashboard:ler`.

## Task 1: Especificar domínio e cálculos de pesagem

**API files:**
- Create: `src/metrics/weights/domain/weight-measurement.ts`
- Create: `src/metrics/weights/domain/weight-measurement.spec.ts`
- Create: `src/metrics/weights/application/services/weight-metrics.ts`
- Create: `src/metrics/weights/application/services/weight-metrics.spec.ts`

- [x] RED para limites de peso/data, normalização, correção e GMD com zero/um/
  múltiplos registros, mesma data, perda e arredondamento.
- [x] Commit RED `test(metrics): specify weight measurement rules` (`8377344`).
- [x] Implementar funções puras sem Nest/Prisma.
- [x] Executar focais, arquitetura e lint.
- [x] Commit GREEN `feat(metrics): implement weight measurement domain`
  (`4c2091a`).

## Task 2: Implementar casos de uso e ports

**API files:**
- Create: `src/metrics/weights/application/ports/weight.repository.ts`
- Create: `src/metrics/weights/application/use-cases/manage-weights.use-case.ts`
- Create: `src/metrics/weights/application/use-cases/manage-weights.use-case.spec.ts`

- [x] RED para listar/detalhar, registrar, corrigir com motivo, animal ausente,
  data anterior à entrada, concorrência lógica e falha sem contexto tenant.
- [x] Commit RED `test(metrics): specify auditable weight use cases`
  (`08a6b75`).
- [x] Implementar UseCase derivando `farmId`/ator somente do contexto.
- [x] Executar focal, arquitetura, lint e build.
- [x] Commit GREEN `feat(metrics): implement auditable weight use cases`
  (`f147f4f`).

## Task 3: Migrar persistência e atomicidade

**API files:**
- Modify: `prisma/tenant/schema.prisma`
- Create: `prisma/tenant/migrations/202609270001_wave05_weights/migration.sql`
- Create: `src/metrics/weights/infrastructure/prisma-weight.repository.ts`
- Create: `src/metrics/weights/infrastructure/prisma-weight.repository.spec.ts`
- Modify: `test/migrations/database-test-harness.ts`
- Modify: `test/migrations/tenant-empty-schema.e2e-spec.ts`
- Modify: `test/migrations/tenant-upgrade.e2e-spec.ts`

- [x] RED do adapter para revisão imutável, recálculo do peso atual e rollback
  completo quando qualquer escrita falhar.
- [x] Commit RED `test(metrics): specify atomic weight persistence` (`1f8882a`).
- [x] Adicionar colunas/constraints/índices sem editar migrations publicadas e
  implementar transações Prisma tenant-aware.
- [x] Executar focal, build, arquitetura e migrations limpa/upgrade em banco
  filho descartável.
- [x] Commit GREEN `feat(metrics): persist auditable weights atomically`
  (`d89f167`).

## Task 4: Expor API autenticada de pesagens

**API files:**
- Create: `src/metrics/weights/presentation/dto/weight.dto.ts`
- Create: `src/metrics/weights/presentation/weight.controller.ts`
- Create: `src/metrics/weights/presentation/weight.controller.spec.ts`
- Create: `src/metrics/weights/weights.module.ts`
- Modify: `src/app.module.ts`

- [x] RED do contrato `/pesagens` para paginação, detalhe, criação e correção,
  DTOs camelCase, envelopes e allow/deny por permissão.
- [x] Commit RED `test(metrics): specify secured weight api` (`2c795f2`).
- [x] Implementar controller fino, Swagger completo e composição DI.
- [x] Executar focal, contrato, arquitetura, lint e build.
- [x] Commit GREEN `feat(metrics): expose secured weight api` (`7ee2df1`).

## Task 5: Provar isolamento concorrente de pesagens

**API files:**
- Create: `test/isolation/weight-isolation.e2e-spec.ts`

- [ ] RED com duas fazendas registrando/corrigindo simultaneamente; leitura,
  detalhe e revisão nunca cruzam escopo e `pesoAtual` permanece coerente.
- [ ] Commit RED `test(metrics): prove concurrent weight isolation`.
- [ ] Corrigir somente lacunas observadas e repetir em banco filho descartável;
  commit GREEN apenas se produção mudar.

## Task 6: Implementar read model zootécnico

**API files:**
- Create: `src/metrics/dashboard/application/ports/dashboard.repository.ts`
- Create: `src/metrics/dashboard/application/use-cases/get-farm-dashboard.use-case.ts`
- Create: `src/metrics/dashboard/application/use-cases/get-farm-dashboard.use-case.spec.ts`
- Create: `src/metrics/dashboard/infrastructure/prisma-dashboard.repository.ts`
- Create: `src/metrics/dashboard/infrastructure/prisma-dashboard.repository.spec.ts`

- [ ] RED para contagens, peso médio, GMD, evolução mensal, distribuições por
  lote/pasto e três classes de alerta usando fixture conhecida.
- [ ] Commit RED `test(metrics): specify persisted dashboard indicators`.
- [ ] Implementar agregações com escopo de fazenda e aritmética decimal
  explícita; nenhuma query usa dados de outra fazenda.
- [ ] Executar focais, reconciliação e arquitetura.
- [ ] Commit GREEN `feat(metrics): derive dashboard from persisted data`.

## Task 7: Integrar CEPEA com timeout e fallback durável

**API files:**
- Modify: `prisma/admin/schema.prisma`
- Create: `prisma/admin/migrations/202609270001_market_price_cache/migration.sql`
- Create: `src/integrations/market-price/application/ports/market-price.gateway.ts`
- Create: `src/integrations/market-price/application/ports/market-price-cache.repository.ts`
- Create: `src/integrations/market-price/application/use-cases/get-market-price.use-case.ts`
- Create: `src/integrations/market-price/application/use-cases/get-market-price.use-case.spec.ts`
- Create: `src/integrations/market-price/infrastructure/cepea-market-price.gateway.ts`
- Create: `src/integrations/market-price/infrastructure/cepea-market-price.gateway.spec.ts`
- Create: `src/integrations/market-price/infrastructure/prisma-market-price-cache.repository.ts`

- [ ] RED para cache hit, refresh, timeout 2 s, payload inválido, fallback stale,
  ausência de fallback e logs sem URL/query/body sensível.
- [ ] Commit RED `test(metrics): specify resilient cepea gateway`.
- [ ] Implementar `fetch` atrás do port com `AbortController`, parser ancorado
  em conteúdo (nunca offsets fixos), cache admin durável e observabilidade.
- [ ] Executar focais, admin migration descartável, lint e build.
- [ ] Commit GREEN `feat(metrics): add resilient cepea indicator`.

## Task 8: Substituir dashboard legado e publicar OpenAPI

**API files:**
- Create: `src/metrics/dashboard/presentation/dashboard.controller.ts`
- Create: `src/metrics/dashboard/presentation/dto/dashboard-response.dto.ts`
- Create: `src/metrics/dashboard/dashboard.module.ts`
- Modify: `src/app.module.ts`
- Delete: `src/dashboard/dashboard.controller.ts`
- Delete: `src/dashboard/dashboard.service.ts`
- Delete: `src/dashboard/dashboard.module.ts`
- Modify: `test/fixtures/legacy-route-quarantine.json`
- Modify: `test/contract/openapi-contract.e2e-spec.ts`

- [ ] RED para `GET /dashboard/summary`, autenticação, `dashboard:ler`, tipos,
  preço fresh/stale/null e ausência dos endpoints legados.
- [ ] Commit RED `test(metrics): specify real dashboard contract`.
- [ ] Compor read model + indicador, remover controller quarantined e publicar
  somente o contrato novo.
- [ ] Executar focais, contrato, arquitetura, lint e build.
- [ ] Commit GREEN `feat(metrics): replace legacy dashboard api`.

## Task 9: Gerar cliente e entregar jornadas web

**Web files:**
- Modify: `packages/contracts/openapi/gado-api.json`
- Modify: `packages/contracts/src/generated/gado-api.ts`
- Create: `packages/api-client/src/metrics-client.spec.ts`
- Create: `packages/api-client/src/metrics-client.ts`
- Modify: `packages/api-client/src/index.ts`
- Create: `apps/gado-app/src/features/metrics/pages/weights-page.spec.tsx`
- Create: `apps/gado-app/src/features/metrics/pages/weights-page.tsx`
- Modify: `apps/gado-app/src/pages/dashboard-page.spec.tsx`
- Modify: `apps/gado-app/src/pages/dashboard-page.tsx`
- Modify: `apps/gado-app/src/app/app-router.tsx`
- Create: `apps/gado-app/src/features/metrics/metrics-journey.e2e.spec.tsx`
- Modify: `apps/gado-app/src/services/operational-gateway.ts`

- [ ] RED cliente gerado e páginas: loading/vazio/erro/sucesso/sem permissão,
  registro/correção auditável, métricas, distribuições, alertas e CEPEA stale.
- [ ] RED E2E: sessão com fazenda -> pesar animal -> dashboard reflete o dado,
  mockando somente transporte.
- [ ] Commit RED `test(metrics): specify weight and dashboard journeys`.
- [ ] Gerar contrato, implementar `MetricsClient`, remover adapter legado de
  dashboard/animais e ligar rotas/telas sem `fetch` direto.
- [ ] Executar focais/E2E, contracts, network, lint, typecheck e build app.
- [ ] Commit GREEN `feat(metrics): deliver real weight dashboard journeys`.

## Task 10: Reconciliar fixture e encerrar G4-metrics

**Files:**
- Create: `test/integration/metrics-reconciliation.integration-spec.ts`
- Create: `docs/testing/wave-05-metrics.tdd.md`
- Create: `docs/handoffs/2026-09-27-wave-05-complete.md`
- Modify: `docs/handoffs/progress-tracker.md`

- [ ] RED de uma massa conhecida com pesos/lotes/pastos e resultados esperados;
  tolerância máxima 0,001 kg/GMD e zero para contagens.
- [ ] Commit RED `test(metrics): reconcile known dashboard fixture`.
- [ ] API gates: lint, build, unit, architecture, contract, integration,
  isolation, migrations, coverage e no-skipped em bancos filhos descartáveis.
- [ ] Web gates: contracts, lint, typecheck, architecture, coverage, builds,
  network e bundles.
- [ ] Confirmar >=80%, nenhum skipped, bancos removidos e worktrees limpas.
- [ ] Atualizar tracker/evidência/handoff, commit
  `docs(metrics): close wave 05 gate` e push da branch nos dois remotos.

## Gate G4-metrics

- [ ] Pesagens registradas e corrigidas com trilha e atomicidade.
- [ ] Isolamento por fazenda comprovado sob concorrência.
- [ ] Dashboard deriva exclusivamente de dados persistidos e fixture conhecida.
- [ ] CEPEA possui timeout, cache durável, observabilidade e fallback válido.
- [ ] Contrato gerado é consumido pelo frontend sem tipos duplicados.
- [ ] Jornada de pesagem atualiza o dashboard no `gado-app`.
- [ ] Todos os gates finais estão verdes.
