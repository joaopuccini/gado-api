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
dependências de framework no `AdminLoginUseCase` e pela ausência de UseCase no
`PermissionsController`. Esses problemas antecedem a Task 2.2.4 e devem ser
corrigidos antes do Gate G1-identity.

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
