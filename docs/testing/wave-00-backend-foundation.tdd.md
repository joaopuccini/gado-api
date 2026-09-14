# Evidências TDD — Onda 00, fundações backend

Data de fechamento: 2026-09-14  
Branch: `feat/wave-00-backend-foundation`  
Plano: `docs/superpowers/plans/2026-09-12-wave-00-backend-foundation.md`

## Resultado

O Gate G0 foi aprovado. A sequência local equivalente ao CI terminou com código de saída `0`, sem testes ignorados, usando PostgreSQL real em uma base exclusivamente descartável validada pelo padrão `gado_wave00_test_<12 hex>`.

Cobertura observada da fundação:

| Métrica | Resultado | Gate |
|---|---:|---:|
| Statements | 96,35% | 80% |
| Branches | 84,21% | 80% |
| Functions | 100% | 80% |
| Lines | 97,82% | 80% |

## Trilha RED/GREEN

Os commits RED preservam os testes antes da implementação. Para as Tasks 2–8, o checkpoint anterior preservou os hashes e a verificação GREEN consolidada, mas não reteve toda a saída numérica de cada execução RED; isso é indicado abaixo sem inventar resultados. Todos os comportamentos foram reexecutados no fechamento pela suíte completa.

| Task | Garantia | Evidência RED | Evidência GREEN | Commits | Coverage |
|---|---|---|---|---|---|
| 2 | Um único contexto assíncrono, fail-closed e sem vazamento concorrente | `npm run test:unit -- execution-context.store.spec.ts`; falha histórica capturada pelo commit de teste, saída detalhada não retida | Checkpoint: unit `3 suites/10 tests` e isolation `2 suites/3 tests`; fechamento: unit e isolation PASS | `3ade36e` / `37804a7` | Incluída no agregado final |
| 3 | Domínio de erros e filtro global único sem vazamento interno | `npm run test:unit -- global-exception.filter.spec.ts`; falha histórica contra os contratos legados, saída detalhada não retida | Fechamento: unit PASS e contract PASS | `d21ff6f` / `4190f5e` | Incluída no agregado final |
| 4 | Logs JSON correlacionados e redacted por interceptor global | `npm run test:unit -- logging.interceptor.spec.ts`; falha histórica capturada pelo commit de teste, saída detalhada não retida | Fechamento: unit PASS; testes adicionais cobrem todos os níveis do logger, redaction, ciclos e sink padrão | `c14d22d` / `8281323`, reforço `3fb5ce1` | Incluída no agregado final |
| 5 | ValidationPipe e envelopes globais estritamente camelCase | `npm run test:unit -- global-validation.pipe.spec.ts`; falha histórica contra pipe/envelopes ausentes, saída detalhada não retida | Fechamento: unit PASS e contract `2 suites/9 tests` PASS | `046867e` / `1ea02fd` | Incluída no agregado final |
| 6 | Tenant resolvido por identidade verificada, registry, membership e fazenda | `npm run test:unit -- resolve-tenant-context.use-case.spec.ts`; falha histórica capturada pelo commit de teste, saída detalhada não retida | Fechamento: use case e repository unitários PASS | `1f92ef7` / `4f92551` | Incluída no agregado final |
| 7 | Prisma dinâmico isola schemas reais sem reescrever SQL | `npm run test:integration`; falha histórica antes da factory isolada, saída detalhada não retida | Fechamento: integration `1 suite/1 test` PASS e isolation PASS | `9328e08` / `ab0920e` | Incluída no agregado final |
| 8 | Persistência tenant não possui client default nem bypass manual | `npm run test:unit -- tenant-prisma.service.spec.ts`; falha histórica exigindo contexto, saída detalhada não retida | Checkpoint e fechamento: unit/isolation PASS; busca pelas APIs proibidas sem ocorrências | `bcd9185` / `2ed2871` | Incluída no agregado final |
| 9 | Admin vazio, tenant vazio e upgrade/retry são reproduzíveis e checksummed | `npm run test:migrations`: admin retornou zero tabelas e os caminhos tenant falharam por implementações ausentes | `npm run test:migrations -- --runInBand`: `3 suites/3 tests` PASS; `prisma migrate status`: database schema up to date | `a201329`, `1d62efc`, `4e62c76` / `534270b` | Incluída no agregado final |
| 10 | Limites hexagonais e OpenAPI completo para toda rota nova | `npm run test:architecture`: UseCase dependia de Nest e havia import cross-module de infraestrutura; `test:contract` falhou tags, erros e camelCase legados antes da quarentena ser aplicada corretamente | Architecture `3 suites/11 tests` PASS; contract `2 suites/9 tests` PASS | `3418e3e` / `ccb0759` | Incluída no agregado final |
| 11 | CI executa todos os gates e impede regressão abaixo de 80% | `ci-workflow.spec.ts`: workflow inexistente; primeiro coverage: 77,08% statements, 58,94% branches, 83% functions, 79,17% lines | Workflow GREEN; sequência completa exit `0`; coverage 96,35/84,21/100/97,82 | `d6aeb6e` / `85591f8`; robustez do coverage concluída no commit final | Gate aprovado |

## Sequência final observada

Executada em ordem, com `DATABASE_URL` e `TEST_DATABASE_URL` apontando somente para a base descartável:

```text
npm run lint:check                                      exit 0
npm run build                                           exit 0
npm run test:unit -- --runInBand                        13 suites, 61 tests, PASS
npm run test:architecture -- --runInBand                3 suites, 11 tests, PASS
npm run test:contract -- --runInBand                    2 suites, 9 tests, PASS
npm run test:integration -- --runInBand                 1 suite, 1 test, PASS
npm run test:migrations -- --runInBand                  3 suites, 3 tests, PASS
npm run test:isolation -- --runInBand                   2 suites, 3 tests, PASS
npm run test:cov -- --runInBand                         20 suites, 76 tests, PASS
npm run test:no-skipped                                 exit 0
```

O teste de coverage reexecuta testes de unidade, contrato, integração, isolamento e as duas migrations tenant; por isso seus 76 testes não devem ser somados aos totais anteriores como casos distintos. O spec administrativo que apenas chama `prisma migrate deploy` permanece no gate dedicado de migrations e é excluído somente do coverage: repetir a CLI pelo endpoint PgBouncer/Neon pode reter o advisory lock de sessão, enquanto não adiciona cobertura a `src/**`. O teste arquitetural impede que essa exclusão alcance as migrations tenant.

## Auditoria do Gate G0

| Condição | Evidência | Status |
|---|---|---|
| Exatamente um AsyncLocalStorage | Uma instanciação em `ExecutionContextStore` | PASS |
| Tenant somente por identidade verificada | `ResolveTenantContextUseCase` valida registry, membership e fazenda; hints de transporte não são autoridade | PASS |
| Banco tenant fail-closed | `TenantPrismaService.requireTenant()` e testes concorrentes com schemas reais | PASS |
| Nenhuma query reescrita em runtime | Factory usa `PrismaPg(..., { schema })`; scanner não encontra APIs de rewrite/bypass | PASS |
| Observabilidade interceptada | `APP_INTERCEPTOR` registra logging e envelope; logger é JSON, correlacionado e redacted | PASS |
| Filtro e erro únicos em camelCase | Um `APP_FILTER`, catálogo de domínio e contrato HTTP testado | PASS |
| Pipe global e DTOs | Um `APP_PIPE`; validação e metadados dos contratos testados | PASS |
| OpenAPI de endpoints novos | Gate ignora apenas controllers nominados na quarentena e bloqueia novos contratos incompletos | PASS |
| Migrations admin/tenant/upgrade | SQL versionado, SHA-256 tenant, advisory lock, transação e retry idempotente | PASS |
| Limites arquiteturais | Scanner bloqueia Controller -> infraestrutura, UseCase -> framework e infraestrutura cross-module | PASS |
| Coverage mínimo | 96,35/84,21/100/97,82 | PASS |
| Trilha TDD real | Commits RED/GREEN preservados e comandos finais observados | PASS |

## Quarentenas e dívida explícita

- O lint completo do legado possuía milhares de violações antes da onda. `scripts/lint-new-code.mjs` usa o commit imutável `2423aa98a3098b1f084af1a559f24016147d6cce` como baseline, exige histórico Git no CI e aplica lint sem tolerância a todo arquivo TypeScript novo. Arquivos legados já graduados também voltaram ao gate. A quarentena não cresce silenciosamente porque novos arquivos não existem naquele commit.
- Os controllers legados continuam listados individualmente em `test/fixtures/legacy-route-quarantine.json`. Eles não satisfazem ainda o contrato OpenAPI novo e devem sair da lista na onda que os migrar.
- A base descartável e todos os schemas tenant criados pelos testes são limpos após uso. Nenhum schema de cliente e nenhum banco produtivo foi alterado.
