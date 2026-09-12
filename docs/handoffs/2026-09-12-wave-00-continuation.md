# Handoff — continuação da Onda 00 do Gado SaaS

Data do checkpoint: 2026-09-12

## Onde continuar

- Workspace pai: `C:\Users\Joao Puccini\Desktop\repositorios-git\gado`
- Worktree de execução: `C:\Users\Joao Puccini\Desktop\repositorios-git\gado\gado-api\.worktrees\wave-00-backend-foundation`
- Branch: `feat/wave-00-backend-foundation`
- Próxima atividade: **Task 9 — Migrations administrativas e tenant reproduzíveis**

Abra o worktree acima diretamente no IDE/agente. Não execute a Onda 00 no checkout principal de `gado-api` e não refaça as Tasks 1–8.

## Leitura obrigatória antes de alterar código

1. `AGENTS.md` do workspace pai.
2. `.agent/rules/gado-saas-engineering.md` do workspace pai.
3. `docs/superpowers/plans/2026-09-12-wave-00-backend-foundation.md`.
4. `docs/superpowers/plans/2026-09-12-gado-saas-master.md`.
5. `docs/superpowers/specs/2026-09-11-arquitetura-migracao-saas-design.md`.
6. `docs/architecture/adr/0001-dynamic-tenant-schema-with-prisma.md`.

As regras canônicas exigem, entre outros pontos: TDD com commits RED/GREEN, isolamento fail-closed por `AsyncLocalStorage`, contrato integralmente `camelCase`, observabilidade estruturada, filtro/pipe/interceptor globais, arquitetura hexagonal e migrations versionadas. Não flexibilizar essas premissas para compatibilizar o legado.

## Estado concluído

Tasks 1–8 foram concluídas e registradas no histórico da branch:

```text
19d1d12 chore: establish migration quality gates
3ade36e test: specify isolated execution context
37804a7 feat: add fail-closed execution context
d21ff6f test: specify global error contract
4190f5e feat: enforce global error domain
c14d22d test: specify structured request observability
8281323 feat: add correlated structured logging
3fb5ce1 test: tighten structured logging assertions
046867e test: specify global validation and envelopes
1ea02fd feat: enforce global api contract
1f92ef7 test: specify verified tenant authority
4f92551 feat: resolve tenant from verified identity
9328e08 test: prove dynamic tenant schema isolation
ab0920e feat: prove isolated tenant prisma clients
bcd9185 test: require tenant context for database access
2ed2871 refactor: enforce fail-closed tenant persistence
```

Entregas principais:

- Um único `ExecutionContextStore` baseado em `AsyncLocalStorage`, inicializado na fronteira e enriquecido após identidade verificada.
- Resolução autoritativa de tenant pelo JWT verificado, registry, membership e fazenda; `schemaName` fornecido pelo cliente é ignorado.
- Acesso Prisma de tenant fail-closed, sem fallback para `public`, sem tenant global mutável e sem `search_path` compartilhado.
- `TenantSchemaName` aceita somente `tenant_` seguido de 32 caracteres hexadecimais minúsculos.
- Factory Prisma isolada por schema usando a opção `schema` do adapter `PrismaPg` e pool limitado a 2 conexões.
- Um domínio global de erros com contrato `camelCase`, `GlobalExceptionFilter`, `ValidationPipe`, envelope de sucesso e interceptor global de logging JSON correlacionado/redacted.
- Contextos, interceptors e testes antigos inseguros foram removidos na Task 8.

Observação de implementação: a factory cria o client de forma síncrona e lazy para preservar a API síncrona de `TenantPrismaService.getClient()`. Conexão e queries continuam assíncronas. O teste de integração real aprovou esse desenho.

## Evidências verificadas no checkpoint

No commit `2ed2871`:

```powershell
npx eslint src/tenant/tenant-prisma.service.ts src/tenant/tenant-prisma.service.spec.ts src/tenant/infrastructure/tenant-prisma-client.factory.ts test/isolation/tenant-prisma-isolation.e2e-spec.ts src/common/context/index.ts src/common/interceptors/index.ts src/app.module.ts src/tenant/tenant.module.ts src/identity-access/infrastructure/prisma-tenant-registry.repository.ts
# exit 0

npx tsc --noEmit --incremental false
# exit 0

npm run test:unit -- tenant-prisma.service.spec.ts execution-context.store.spec.ts animais.service.spec.ts
# 3 suites e 10 testes aprovados; zero skipped

npm run test:isolation
# 2 suites e 3 testes aprovados contra PostgreSQL/Neon real
```

O teste real criou dois schemas descartáveis, provou isolamento entre dois tenants e duas fazendas concorrentes e limpou os schemas ao final. Uma auditoria somente leitura confirmou zero schemas de teste remanescentes.

Também foi verificado:

```powershell
rg -n "\bTenantContext\b|\bRequestContext\b|globalTenantPrismaService|getClientForSchema|executeInTenantSchema|console\." src --glob '*.ts'
# nenhuma ocorrência

git diff --check
# exit 0
```

## Banco de dados e segurança operacional

- A conexão usada nos testes está no `.env` do checkout principal de `gado-api`; carregue `DATABASE_URL` em `TEST_DATABASE_URL` no processo sem imprimir o valor.
- Nunca registrar, colar no chat ou commitar credenciais.
- Testes e geração de migrations só podem usar recursos descartáveis explicitamente validados.
- Não executar `migrate reset`, `db push`, DROP amplo ou mutation destrutiva em `public`, `gado_admin` ou schemas de cliente.
- Antes de qualquer operação destrutiva, validar o nome exato e restringir a schemas `tenant_<32hex>` criados pelo próprio teste.
- O adapter Neon apresentou apenas um aviso futuro sobre semântica de `sslmode=require`; não houve falha funcional.

## Próximas Tasks

### Task 9 — migrations reproduzíveis

Seguir exatamente a seção 11 do plano da Onda 00:

1. Criar primeiro os testes RED dos caminhos banco administrativo vazio, tenant vazio e upgrade/retry idempotente.
2. Commitar o RED antes da implementação.
3. Separar schemas Prisma e migrations em `prisma/admin` e `prisma/tenant`.
4. Aplicar migration tenant somente pelo marcador reservado `"__tenant__"`, com SHA-256, advisory lock, transação e tabela `_gado_tenant_migrations`.
5. Substituir o provisionamento ad hoc ainda existente por UseCase/port/adapter versionado.
6. Provar GREEN no PostgreSQL real e limpar somente recursos descartáveis.

Dívida importante para esta Task: `SocialProvisioningService` ainda contém provisionamento/cópia de schema por SQL legado, e `OrganizacoesService` deixou de provisionar o schema imediatamente. Ambos devem convergir para o fluxo versionado; é proibido restaurar cópia de tabelas de `public`.

Verificar se `TenantRegistryService` ficou sem consumidores após a remoção dos testes antigos; removê-lo somente se `rg` confirmar ausência de referências e os gates continuarem verdes.

### Task 10 — arquitetura e OpenAPI

Criar os gates RED/GREEN de fronteiras hexagonais e completude OpenAPI, permitindo exceção apenas para a quarentena legada já registrada.

### Task 11 — CI e coverage

Criar o workflow e os gates de CI. A fundação deve atingir no mínimo 80% em statements, branches, functions e lines. Não declarar coverage sem observar o relatório real.

### Task 12 — limpeza e relatório TDD

Remover duplicidades mortas, repetir todos os gates, preencher o relatório com comandos/resultados/hashes reais e marcar G0 somente se todas as condições estiverem verdes.

## Débito e limitações conhecidas

- O lint global do legado já possuía baseline muito alto (`2931` problemas, sendo `2903` erros). Não fazer uma reforma mecânica ampla durante a Onda 00. Código novo/alterado deve passar pelo lint direcionado; a quarentena deve permanecer mensurável e sem crescer.
- Ainda não existe cadeia definitiva de migrations tenant/admin: esse é o gate da Task 9.
- Não assumir que onboarding está concluído só porque a resolução de tenant e o client isolado estão prontos.
- Não marcar G0 nem iniciar a Onda 01 antes das Tasks 9–12 e do relatório final de evidências.

## Primeiro comando da continuação

```powershell
git status --short
git log --oneline --decorate -20
```

O esperado após este handoff ser commitado é uma árvore limpa. Depois, começar a Task 9 pelo teste RED, preservando a sequência de commits indicada no plano.
