# Evidência TDD — Onda 03: conta, fazendas, equipe e assinatura

## Fonte

- Plano mestre: `docs/superpowers/plans/2026-09-12-gado-saas-master.md`
- Plano executado: `docs/superpowers/plans/2026-09-22-wave-03-account.md`
- Tracker: `docs/handoffs/progress-tracker.md`
- ADR de permissões: `docs/architecture/adr/0003-permissions-catalog-as-code-enum.md`

## Resultado

O Gate G2-account passou. O proprietário administra conta, fazendas, equipe,
perfis e assinatura exclusivamente no `gado-app`; o `gado-admin` mantém rota,
sessão, audience e bundle independentes. Todos os acessos tenant continuam
fail-closed e usam apenas contexto verificado.

## Sequência RED/GREEN

| Entrega                           | RED                                        | GREEN                                      | Evidência principal                               |
| --------------------------------- | ------------------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| CRUD e seleção de fazendas        | `b64cdf2`, `87752e0`, `b8df121`, `9217c34` | `ef38e7a`, `6fcccdf`, `94f4513`, `2c08aa3` | UseCases, Prisma, HTTP e composição               |
| Hierarquia matriz/filial          | `9e6d81f`                                  | `fea521b`, `f2cbd07`, `9237b10`            | policy antes do repository e migration aditiva    |
| Isolamento entre tenants/fazendas | `5e704f5`                                  | `2389b66`                                  | outro tenant e contexto ausente negados           |
| Convites                          | `df26ae5`, `ed658bd`                       | `f0cd00f`, `805c797`                       | token hash-only, aceite único, retry e outbox     |
| Limites de plano                  | `2b007d1`                                  | `9c5e18f`                                  | usuários/fazendas ativos e assinatura fail-closed |
| Vínculos, perfis e papéis         | `7c319f5`, `8967292`, `c6e54e1`            | `4925021`, `e3785ea`, `b802230`            | perfis customizados e matriz allow/deny           |
| Contrato público de conta         | `7dc7dae`                                  | `6f07d51`                                  | DTOs seguros e OpenAPI `/account/*`               |
| Cliente web de conta              | `a178847`, `97b3893`                       | `b4e3500`, `c123166`                       | transporte central e validação fail-closed        |
| Páginas de autosserviço           | `95d2f7c`, `d843f86`, `a083432`            | `09ec654`, `18c45a0`, `ca7a4b0`            | conta, assinatura, fazendas e equipe              |
| Separação admin/cliente           | `eaf9956`                                  | `c7615a4`                                  | rota, link, sessão, audience e bundle separados   |

O fechamento também removeu a dívida de lint do escopo em `d483d24`,
estabilizou o harness remoto de migrations em `eba81ec` e elevou a cobertura
do cliente de conta em `242964b`, sem reduzir thresholds.

## Contratos web determinísticos

- SHA-256 do snapshot OpenAPI:
  `041E6C683681A9A71442D0B132D58A1159AA0214FF4EED9A98E0533D353B3B36`.
- SHA-256 dos tipos gerados:
  `B4B2BB582BCB25DE03791DDE8F310E68232D6FC327EF219E5D85335B6FE3C9E8`.
- `contracts:check` e a fronteira de rede passaram sem `fetch`, Axios ou
  storage direto nas features.

## Gate backend

Executado em 2026-09-22:

```text
npm run lint:check                              exit 0
npm run build                                   exit 0
npm run test:unit -- --runInBand                43 suites / 214 testes
npm run test:architecture -- --runInBand         6 suites / 23 testes
npm run test:contract -- --runInBand             3 suites / 18 testes
npm run test:integration -- --runInBand           2 suites / 2 testes
npm run test:isolation -- --runInBand             5 suites / 11 testes
npm run test:migrations -- --runInBand            3 suites / 3 testes
npm run test:cov -- --runInBand                  54 suites / 246 testes
npm run test:no-skipped                          exit 0
```

Coverage backend:

| Métrica    | Resultado | Mínimo |
| ---------- | --------: | -----: |
| Statements |    90,20% |    80% |
| Branches   |    82,38% |    80% |
| Functions  |    85,07% |    80% |
| Lines      |    91,59% |    80% |

## Gate frontend

```text
npm run contracts:check                         exit 0
npm run lint                                    exit 0
npm run typecheck                               exit 0
npm run test:architecture                        2 arquivos / 7 testes
npm run test:coverage                           25 arquivos / 101 testes
npm run build:app                               exit 0
npm run build:admin                             exit 0
npm run check:network                           exit 0
npm run check:bundles                           exit 0
```

Coverage frontend:

| Métrica    | Resultado | Mínimo |
| ---------- | --------: | -----: |
| Statements |    89,15% |    80% |
| Branches   |    82,83% |    80% |
| Functions  |    91,04% |    80% |
| Lines      |    90,98% |    80% |

O comando `--runInBand` descrito no plano não é aceito pelo Vitest 4.1.11;
os dois gates Vitest foram executados pelos scripts canônicos, sem essa opção.

## Segurança de migrations

- integração e isolamento passaram no banco filho
  `gado_wave00_test_b316d5d9d0fd`;
- clean-create, upgrade, retry e checksum passaram 3/3 em
  `gado_wave00_test_d17e718c3799`;
- coverage completo com persistência passou em
  `gado_wave00_test_087cd3342c50`;
- retry de provisioning passou 8/8 e imutabilidade/ordem da cadeia passou 6/6;
- todos os bancos filhos foram removidos ao final, inclusive nas tentativas
  diagnósticas que falharam;
- não foi usado `db push`, `migrate reset` ou schema/banco persistente para os
  gates.

O Prisma remoto apresentou latência variável e uma falha transitória do schema
engine. O harness agora permite uma única reexecução idempotente de
`migrate deploy` e mantém erro fail-closed após a segunda tentativa. O spec
administrativo respeita o teto real do subprocesso mais as consultas de
validação.

## Observações não bloqueantes

- Vite informa que o bundle do `gado-app` ultrapassa 500 kB; o gate de build e
  o isolamento de bundles passam. Code splitting fica como otimização futura.
- `pg` avisa sobre a futura mudança semântica de `sslmode=require`; a conexão
  atual permaneceu verificada e todos os gates passaram.
