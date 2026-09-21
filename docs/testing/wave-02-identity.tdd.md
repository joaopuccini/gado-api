# Evidência TDD — Onda 02: identidade

## Fonte

- Plano mestre: `docs/superpowers/plans/2026-09-12-gado-saas-master.md`
- Tracker executável: `docs/handoffs/progress-tracker.md`
- ADR: `docs/architecture/adr/0003-permissions-catalog-as-code-enum.md`

## Task 2.2.4 — identidades operacionais tenant

Jornada: como serviço de identidade operacional, preciso relacionar a identidade
global ao usuário local e às fazendas autorizadas sem perder dados existentes nem
alterar migrations tenant já publicadas.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| A migration tenant publicada mantém o checksum original | arquitetura | PASS | `npm run test:architecture -- --runInBand tenant-identity-schema.spec.ts` |
| `Usuario` e `UsuarioFazenda` mantêm camelCase em TypeScript e snake_case no PostgreSQL | arquitetura | PASS | `test/architecture/tenant-identity-schema.spec.ts` |
| A nova migration usa `RENAME COLUMN` e não usa `DROP COLUMN`/`ADD COLUMN` | arquitetura | PASS | `test/architecture/tenant-identity-schema.spec.ts` |
| A cadeia cria um tenant vazio e atualiza um tenant na versão anterior | integração | PASS | `npm run test:migrations -- --runInBand` — 3 suites / 3 testes |
| Retry não reaplica versões e checksum divergente falha fechado | integração | PASS | `npm run test:migrations -- --runInBand` |
| Schema Prisma tenant é válido e o client é gerado | contrato ORM | PASS | `prisma validate` e `npm run prisma:generate:tenant` |
| Aplicação compila após a mudança | build | PASS | `npm run build` |

### RED

Commit `c6c3c01`. O teste executou 3 casos: 1 passou e 2 falharam pela causa
esperada — a migration histórica estava alterada e a nova migration de identidade
não existia.

### GREEN

Commit `b0da16b`. A migration histórica foi restaurada, uma migration nova e
preservadora de dados foi adicionada e os testes de criação limpa, upgrade, retry
e checksum passaram em banco descartável, removido ao final da execução.

## Coverage e gaps conhecidos

O gate de coverage global executou 83 testes, com 80,51% de statements, 81% de
functions e 81,35% de lines, mas falhou no threshold de branches: 74,38% (<80%).
Também revelou regressões anteriores no endpoint de catálogo e suites que exigem
`TEST_DATABASE_URL`. O gate completo de arquitetura permanece vermelho por
dependências de framework no `AdminLoginUseCase`. A ausência de UseCase no
`PermissionsController` foi corrigida na Task 2.2.11. A dependência restante
antecede a Task 2.2.4 e deve ser corrigida antes do Gate G1-identity.

## Tasks 2.2.7–2.2.8 — login operacional

Jornada: como usuário operacional, preciso autenticar minha identidade global e
receber um token restrito ao tenant e às fazendas às quais estou vinculado.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| E-mail é normalizado e identidade desconhecida falha fechada | unitário | PASS | `tenant-login.use-case.spec.ts` |
| Identidade Google-only e senha inválida não resolvem acesso tenant | unitário | PASS | `tenant-login.use-case.spec.ts` |
| Usuário sem vínculo operacional ativo não recebe token | unitário | PASS | `tenant-login.use-case.spec.ts` |
| Seleção de fazenda expõe apenas acessos ativos e não emite token | unitário | PASS | `tenant-login.use-case.spec.ts` |
| Fazenda fora do vínculo falha fechada | unitário | PASS | `tenant-login.use-case.spec.ts` |
| Token recebe audience `gado-tenant` e claims de tenant/fazenda verificadas | unitário | PASS | `tenant-login.use-case.spec.ts` |

RED no commit `b45163f`: a suite foi descoberta e falhou porque o UseCase ainda
não existia. GREEN no commit `768e190`: 7/7 testes passaram; cobertura restrita
ao UseCase ficou em 100% statements/lines/functions e 92,85% branches. O lint
dos três arquivos novos e o build também passaram.

## Tasks 2.2.9–2.2.10 — validação do token antes do contexto

Jornada: como usuário autenticado, só posso entrar no contexto operacional se o
token tiver audience e claims coerentes com o registry e se minha identidade,
organização, tenant, usuário local e fazenda continuarem ativos.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| Somente `gado-tenant` é aceito em rota operacional | unitário/E2E | PASS | `jwt.strategy.spec.ts`; `tenant-audience.e2e-spec.ts` |
| Token tenant é rejeitado em rota administrativa e vice-versa | E2E | PASS | suites de audience — 5/5 testes |
| Token expirado é rejeitado pelo Passport antes da resolução do contexto | E2E | PASS | `tenant-audience.e2e-spec.ts` |
| Subject, tenant, organização e fazenda inválidos falham antes do contexto | unitário | PASS | `jwt.strategy.spec.ts` |
| Organização assinada precisa coincidir com o registry | unitário | PASS | `resolve-tenant-context.use-case.spec.ts` |
| Identidade global desativada revoga acesso antes de abrir client tenant | unitário | PASS | `prisma-tenant-registry.repository.spec.ts` |
| Token administrativo não recebe contexto tenant implícito | unitário | PASS | `jwt.strategy.spec.ts` |

RED no commit `0e8b002`: 28 testes unitários executaram com 4 falhas esperadas,
e o E2E rejeitou incorretamente `gado-tenant`. GREEN no commit `2bd8308`: 86/86
testes unitários, 5/5 testes E2E de audience/expiração, lint focado e build
passaram. A cobertura focada ficou em 96,7% statements, 86,41% branches, 100%
functions e 97,61% lines.

## Task 2.2.11 — autorização das rotas migradas

Jornada: como usuário operacional, só posso consultar uma rota migrada quando o
token for autenticado e contiver a permissão exigida pelo catálogo canônico.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| Todo controller fora da quarentena ativa autenticação e autorização | arquitetura | PASS | `permissions-catalog.spec.ts` — 4/4 testes |
| Autenticação executa antes da verificação de permissão | unitário | PASS | `permissions.controller.spec.ts` |
| Controller apenas traduz HTTP e delega ao UseCase | unitário/arquitetura | PASS | `permissions.controller.spec.ts`; `hexagonal-boundaries.spec.ts` |
| Catálogo é agrupado sem duplicar permissões | unitário | PASS | `get-permissions-catalog.use-case.spec.ts` |
| Arquivos alterados atendem ao lint | estático | PASS | `npx eslint` focado |
| Aplicação compila | build | PASS | `npm run build` |

RED no commit `108627c`: as duas suites unitárias falharam pela ausência do
UseCase, da delegação e dos guards; o gate arquitetural identificou o único
controller migrado desprotegido. GREEN no commit `1a88887`: 88/88 testes
unitários passaram, o gate específico de arquitetura passou e a cobertura
focada ficou em 100% statements/lines/functions e 83,33% branches.

O gate completo de arquitetura continua vermelho exclusivamente pelos imports
Nest/JWT preexistentes no `AdminLoginUseCase`. O lint global também continua
vermelho por dívida anterior; o lint restrito aos arquivos desta task passou.

## Tasks 2.3.1–2.3.2 — state machine persistida

Jornada: como orquestrador de onboarding, preciso persistir o progresso de cada
execução e etapa para avançar apenas na ordem válida e permitir retries futuros
sem perder o ponto confirmado.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| A sequência `registered → provisioningSchema → applyingMigrations → seeding → validating → active` é obrigatória | unitário | PASS | `provisioning-state.spec.ts` — 6/6 testes |
| Saltos, retrocessos e reabertura de estado terminal falham fechados | unitário | PASS | `provisioning-state.spec.ts` |
| Runs e tentativas de cada etapa são persistíveis no admin | arquitetura | PASS | `provisioning-run-schema.spec.ts` — 2/2 testes |
| Mudança de banco é aditiva e versionada | arquitetura | PASS | migration `20260917153000_add_provisioning_runs` |
| Schema e client admin são válidos | contrato ORM | PASS | `prisma validate` e `prisma generate` com `--schema prisma/admin/schema.prisma` |
| Aplicação compila | build | PASS | `npm run build` |

RED nos commits `57e4633` e `58ce7b6`: o agregado, os modelos Prisma e a
migration ainda não existiam. GREEN no commit `9d5828d`: 94/94 testes unitários
passaram, os testes específicos de arquitetura passaram, o build passou e a
cobertura focada da máquina de estados ficou em 100% em todas as métricas.

Não havia URL de banco de teste configurada; por segurança, a migration não foi
aplicada nesta sessão. Nenhum `db push` ou `migrate reset` foi executado. O gate
global de arquitetura conserva apenas a dívida preexistente do
`AdminLoginUseCase`.

## Tasks 2.3.3–2.3.4 — criação e migração do schema tenant

Jornada: como orquestrador de onboarding, preciso executar a cadeia versionada
no schema tenant validado, dentro de um contexto de job isolado e sem aceitar
nomes arbitrários controlados pelo cliente.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| Nome de schema fora do padrão reservado falha antes da migration | unitário | PASS | `provision-schema.use-case.spec.ts` |
| Identidades administrativas vazias falham fechadas | unitário | PASS | `provision-schema.use-case.spec.ts` |
| Contexto de job contém tenant, organização, ator e permissão de migration | unitário | PASS | `provision-schema.use-case.spec.ts` |
| Contexto assíncrono é descartado após a execução | unitário | PASS | `provision-schema.use-case.spec.ts` |
| Cadeia de migrations existente continua idempotente | unitário | PASS | `migrate-tenant-schema.use-case.spec.ts` — 5/5 testes |
| Aplicação compila | build | PASS | `npm run build` |

RED no commit `8097ed0`: o orquestrador ainda não existia. GREEN no commit
`fb9d5e4`: 99/99 testes unitários passaram, lint focado e build passaram, e a
cobertura focada do novo UseCase ficou em 100% em todas as métricas. A primeira
migration tenant já contém `CREATE SCHEMA IF NOT EXISTS`, portanto a criação e
a evolução usam a mesma cadeia versionada; nenhum comando destrutivo ou
`db push` foi executado.

## Task 7A — composição hexagonal do login administrativo

Jornada: como administrador SaaS, autentico por um endpoint HTTP validado que
delega ao caso de uso e recebe persistência, verificação de senha e emissão JWT
somente por portas de aplicação.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| Controller delega contrato camelCase ao `AdminLoginUseCase` | unitário | PASS | `admin-login.controller.spec.ts` |
| Credenciais inválidas falham sem emitir token | unitário | PASS | `admin-login.use-case.spec.ts` |
| JWT administrativo contém somente audience `gado-admin` | unitário | PASS | `jwt-admin-token.issuer.spec.ts` |
| Composition root injeta adapters sem inverter módulos | arquitetura | PASS | `npm run test:architecture -- --runInBand` — 22/22 |
| Contrato OpenAPI permanece válido | contrato | PASS | `npm run test:contract -- --runInBand` — 9/9 |
| Aplicação compila | build | PASS | `npm run build` |

REDs em `1a52c33` (controller ainda chamava o service legado) e `1935bdc`
(audience JWT duplicada entre payload e opções). GREEN em `b3b6171`, com
repository Prisma, verificador bcrypt e emissor JWT conectados em `AuthModule`.

O Gate G1 completo foi iniciado em 2026-09-21 e parou no primeiro critério:
`npm run lint` terminou com 62 erros preexistentes em cinco suites antigas
(`admin-login.use-case.spec.ts`, `seed-profiles.spec.ts`,
`provision-tenant.use-case.spec.ts` e os dois E2E de audience). As correções
automáticas parciais do comando foram revertidas; a worktree voltou a ficar
limpa. Os gates posteriores não foram executados, conforme o stop condition do
plano.

## Task 2.3.16 — API assíncrona e status (checkpoint parcial)

Jornada: como proprietário em onboarding, inicio o provisionamento por e-mail ou
Google sem receber token operacional e consulto somente o estado público da
execução que pertence à minha identidade.

| Garantia | Tipo | Resultado | Evidência |
|---|---|---|---|
| Cadastro e-mail retorna dados públicos sem token operacional | unitário | PASS | `provisioning-status.spec.ts` — 3/3 testes |
| Callback Google usa o mesmo `StartTenantOnboardingUseCase` | unitário | PASS | `provisioning-status.spec.ts` |
| Status exige credencial curta com audience/purpose próprios e ownership | unitário/arquitetura | PASS | `ProvisioningJwtStrategy`; `GetProvisioningStatusUseCase`; gate 22/22 |
| Contratos OpenAPI e envelopes permanecem válidos | contrato | PASS | `npm run test:contract -- --runInBand` — 9/9 |
| Aplicação compila | build | PASS | `npm run build` |
| Fluxo compartilhado em banco descartável | integração | PASS | `npm run test:integration -- --runInBand` — 2/2 |

O RED permanece registrado em `6370c63` (3 falhas esperadas: endpoints ausentes
e Google no fluxo legado). O GREEN está em `b005c65`. Em 2026-09-21, o gate de
integração passou contra o banco local descartável
`gado_wave00_test_36a054a7477c`, criado em cluster temporário isolado. Nenhum
banco compartilhado foi usado e nenhum comando destrutivo de banco foi
executado.

## Task 7B–7C — fechamento do Gate G1

O primeiro `npm run lint` do fechamento encontrou 62 erros em cinco specs e foi
registrado em `ba724c9`. O GREEN `6a70099` substituiu referências de métodos
desvinculados por mocks tipados, removeu `async` sem `await` e tipou Supertest,
sem relaxar regras. O lint global passou com o heap do processo Node contido por
`NODE_OPTIONS`; três autofixes legados fora do escopo foram restaurados.

O primeiro coverage completo com banco descartável foi o RED: 83,39%
statements, 71,42% branches, 78,39% functions e 84,82% lines. O GREEN
`21b04a2` adicionou cobertura comportamental para os casos de uso de onboarding,
o gateway SES e o repositório Prisma. O resultado final foi:

| Métrica | Resultado | Mínimo |
|---|---:|---:|
| Statements | 90,12% | 80% |
| Branches | 82,08% | 80% |
| Functions | 84,92% | 80% |
| Lines | 91,52% | 80% |

`npx tsc --noEmit` expôs mocks com assinaturas incompletas em quatro specs. O
GREEN `7bde2d5` alinhou esses dublês às portas e o gate passou sem erros. O scan
de fronteira ainda encontrou `schemaName: string` em uma porta de aplicação; o
teste arquitetural RED está em `a8d2f6c` e o GREEN `b64802d` usa
`TenantSchemaName` validado nos dois contratos afetados.

### Gates finais

Executados em 2026-09-21:

```text
npm run lint                                 exit 0
npm run build                                exit 0
npm test -- --runInBand                      31 suites / 147 testes
npm run test:architecture -- --runInBand      6 suites / 23 testes
npm run test:contract -- --runInBand          2 suites / 9 testes
npm run test:integration -- --runInBand       2 suites / 2 testes
npm run test:migrations -- --runInBand        3 suites / 3 testes
npm run test:isolation -- --runInBand         4 suites / 8 testes
npm run test:cov -- --runInBand              40 suites / 167 testes
npm run test:no-skipped                       exit 0
npx tsc --noEmit                              exit 0
git diff --check                              exit 0
```

Integração, migrations, isolamento e coverage usaram exclusivamente o banco
local descartável `gado_wave00_test_506cc3cb8b84`, em um cluster PostgreSQL
temporário. O servidor foi parado e o diretório foi enviado à Lixeira. Não foi
executado `db push`, `migrate reset` nem comando contra banco compartilhado.

O scan de marcadores encontrou apenas exceções de harness/teste e ocorrências
legadas fora da mudança (`animais.service.ts` e comentários TODO em controllers
administrativos). O scan exato por `\bany\b`, `@ts-ignore` e
`@ts-expect-error` não encontrou escapes em `src/tenant-provisioning` ou
`src/auth/application`.
