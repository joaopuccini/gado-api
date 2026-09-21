# Handoff — Onda 02 concluída

Data: 2026-09-21  
Workspace: `C:\Users\Joao Puccini\Desktop\repositorios-git\gado`  
Worktree: `gado-api\.worktrees\wave-02-provisioning-continuation`  
Branch: `feat/wave-02-provisioning-continuation`

## Estado autoritativo

O Gate G1 da Onda 02 está concluído. Não refazer as Tasks 2.1, 2.2 ou 2.3. A
próxima atividade do plano mestre é a Onda 01, Task 1.1, no repositório
`gado-web`: criar os workspaces e builds independentes de `gado-app` e
`gado-admin`.

Antes de alterar código, ler:

1. `AGENTS.md` do workspace pai;
2. `.agent/rules/gado-saas-engineering.md`;
3. `docs/superpowers/plans/2026-09-12-gado-saas-master.md`;
4. `docs/handoffs/progress-tracker.md`;
5. este handoff.

## Entregas concluídas

- catálogo canônico de permissões e perfis-base por papel;
- identidades administrativa e operacional com audiences separadas;
- resolução e revogação de contexto tenant antes do acesso a dados;
- provisionamento multi-etapa idempotente, retomável e serializado;
- migrations tenant versionadas e checksummed;
- bootstrap de proprietário, fazenda principal e vínculo;
- ativação transacional com outbox e adapter SES;
- onboarding assíncrono compartilhado por e-mail e Google, com status público;
- login administrativo composto por portas/adapters hexagonais;
- portas de aplicação protegidas contra nomes de schema crus;
- cobertura da mudança acima de 80% em todas as métricas.

## Última verificação integral

```text
lint                 exit 0
build                exit 0
unit                 31 suites / 147 testes
architecture          6 suites / 23 testes
contract              2 suites / 9 testes
integration           2 suites / 2 testes
migrations            3 suites / 3 testes
isolation             4 suites / 8 testes
coverage             40 suites / 167 testes
no-skipped            exit 0
tsc --noEmit          exit 0
```

Coverage: 90,12% statements, 82,08% branches, 84,92% functions e 91,52%
lines.

Os gates de persistência foram executados somente em
`gado_wave00_test_506cc3cb8b84`, dentro de um cluster PostgreSQL local
temporário. O cluster foi parado e seu diretório foi enviado à Lixeira. Nenhum
`db push`, `migrate reset` ou banco compartilhado foi usado.

## Commits finais do gate

- `6a70099` — specs compatíveis com o lint tipado;
- `21b04a2` — coverage da Onda 02 acima do threshold;
- `7bde2d5` — mocks alinhados às assinaturas das portas;
- `a8d2f6c` — RED para schema cru em porta de aplicação;
- `b64802d` — GREEN com `TenantSchemaName` validado.
- `40f3f4a` — evidências, tracker, plano e handoff do Gate G1.

## Estado local a preservar

A worktree desta onda terminou limpa antes da documentação final. O checkout
principal `gado-api/main` contém alterações preexistentes que não pertencem a
esta onda e não foram tocadas:

- `prisma/admin/migrations/migration_lock.toml` modificado;
- `scratch_check_schema.js` não rastreado.

Não integrar ou descartar esses arquivos automaticamente. A branch de feature
também não deve ser mesclada sem a decisão explícita do usuário.

## Dívida conhecida fora do escopo

O scan de marcadores ainda lista erros genéricos no serviço legado de animais e
comentários TODO para `AdminGuard` em controllers administrativos legados. São
ocorrências anteriores à Onda 02 e não foram introduzidas pelos commits desta
onda. Os autofixes de formatação que `npm run lint` tenta aplicar em três
arquivos legados foram sempre restaurados após o gate.

## Como continuar

Confirme branch, worktree, `git status --short` e `git log --oneline -20`.
Depois abra a Onda 01 Task 1.1 no `gado-web`, preservando TDD, commits RED/GREEN
e os gates registrados no tracker. Não reutilize banco ou schema persistente
para testes.
