# Handoff — Onda 01 concluída

Data: 2026-09-22
Repo de implementação: `gado-web`
Branch: `feat/wave-01-frontend-platform`
Worktree: `gado-web/.worktrees/wave-01-frontend-platform`

## Resultado

A Onda 01 — Dois Frontends e Plataforma Compartilhada — está concluída com o gate `G1-frontend` verde.

- `gado-app` e `gado-admin` possuem entrypoints, rotas e builds independentes.
- O bundle cliente não contém marcadores administrativos.
- Contratos são gerados deterministicamente do snapshot OpenAPI commitado.
- Toda rede passa por `@gado/api-client`; Nominatim está encapsulado no client externo.
- Sessões e audiences de cliente/admin são separadas e fail-closed.
- A SPA legada, HTTP avulso, login simulado e KPIs fictícios foram removidos.
- O workflow CI usa Node 22, checkout completo e executa todos os gates em ordem.

## Commits finais

- `eb18724` — migração dos shells legados para aplicações isoladas (GREEN Task 8)
- `f38028a` — evidência da Task 8
- `7ba8fc1` — especificação RED do workflow CI
- `80a13ff` — workflow, coverage e gates GREEN
- `4b3e4f0` — fechamento documental do G1-frontend

## Evidência final

- `npm ci`: 359 pacotes instalados, 367 auditados, 0 vulnerabilidades.
- Contratos, lint e typecheck: exit `0`.
- Arquitetura: 2 arquivos, 7/7 testes.
- Coverage: 19 arquivos, 62/62 testes.
  - Statements: 86,68% (345/398)
  - Branches: 81,40% (267/328)
  - Functions: 86,40% (89/103)
  - Lines: 88,85% (319/359)
- `build:app`, `build:admin`, `check:network` e `check:bundles`: exit `0`.
- Aviso não bloqueante: chunk principal do `gado-app` com 841,82 kB.

Relatório detalhado: `gado-web/docs/testing/wave-01-frontend-platform.tdd.md`.

## Decisões e dívida explícita

- Respostas de endpoints operacionais cujo OpenAPI ainda declara `content?: never` são tratadas como `unknown` e validadas em adapter legado privado antes de virar view model camelCase.
- `POST /pastos` permanece fail-closed e indisponível na UI enquanto o backend publicar body `snake_case`; a validação camelCase do client não foi relaxada.
- `.ai-style-rules.md` permanece não rastreado no worktree do frontend e não pertence à onda.

## Próxima tarefa

Seguir o plano mestre em **Onda 03 — Conta, Fazendas, Equipe e Assinatura**, começando pela **Task 3.1.1: RED do CRUD de fazenda**. Antes de implementar, criar/confirmar o plano detalhado da Onda 03 e preservar commits RED/GREEN.
