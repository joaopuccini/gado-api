# Evidência TDD — Onda 06: manejo, sanidade, fotos e movimentações

Data de início: 2026-09-27

Branch: `feat/wave-06-handling`

Plano: `docs/superpowers/plans/2026-09-27-wave-06-handling.md`

## Task 6.1 — Modelo persistente e migration versionada

### RED — `9ad0835`

Os testes passaram a exigir a versão `202609270002_wave06_handling`, colunas
de auditoria e domínio, constraints de integridade e índices compostos da onda.

Comando:

```powershell
node scripts/run-disposable-database-command.mjs npm run test:migrations -- --runInBand test/migrations/tenant-empty-schema.e2e-spec.ts test/migrations/tenant-upgrade.e2e-spec.ts
```

Resultado observado: 2 suites falharam pela ausência exclusiva da migration
`202609270002_wave06_handling`; a cadeia real terminava em
`202609270001_wave05_weights`. Banco filho
`gado_wave00_test_71c8f7220810` removido pelo runner.

### GREEN — `8816877`

Foi adicionada uma migration imutável e aditiva que:

- protege GeoJSON/área de pastos;
- registra ator e impede origem igual ao destino em movimentos;
- completa a transferência entre fazendas com constraints e FKs de destino;
- modela evento/status/ciclo reprodutivo;
- adiciona protocolo, dose, próxima dose e auditoria à vacinação;
- substitui caminho público por metadados de object storage, preservando
  compatibilidade dos registros legados;
- cria índices alinhados às consultas por fazenda, animal e data.

Gates executados:

```text
prisma format tenant                         PASS
prisma validate tenant                       PASS
prisma generate tenant + admin               PASS
test:migrations --runInBand                   3/3 PASS
lint:check                                    PASS
build                                         PASS
```

O gate completo usou o banco filho
`gado_wave00_test_f07e1a4c39bd`, removido pelo runner após as três suites.
Nenhum `db push`, `migrate reset` ou schema não descartável foi usado.

## Task 6.2 — Pastos e mapa seguros

### RED — `5d1084e`

O teste comportamental fixou GeoJSON Polygon fechado, área positiva, escopo
derivado da fazenda selecionada, falha fechada fora de contexto tenant e
desativação bloqueada por animais ou histórico. A suíte falhou pela ausência de
`ManagePasturesUseCase` e da porta correspondente.

### GREEN — `a3d76df`

O CRUD legado foi substituído por domínio, UseCase, port, adapter Prisma,
controller autenticado e DTOs `camelCase`. A rota canônica `/pastures` exige
`pastos:ler`/`pastos:gerenciar`, consulta sempre no escopo da fazenda e mantém
exclusão lógica protegida por dependências.

```text
pastures focal                 15/15 PASS
architecture                  23/23 PASS
contract                      19/19 PASS
lint:check                          PASS
build                               PASS
```

`PastosController` foi removido da composition root e da quarentena legada.

## Task 6.3 — Movimentos de pasto e lote atômicos

### RED — `143c7b6`

O único arquivo desse RED foi o teste do `MoveAnimalUseCase`. Ele exigiu origem
derivada do estado persistido, ator e fazenda derivados do contexto verificado,
rejeição de origem igual ao destino e delegação de um comando ao unit of work.
A suíte falhou pela ausência de `MoveAnimalUseCase`. Esse RED não provou
rollback, concorrência, envelope HTTP nem normalização da falha `P2034`.

### GREEN inicial — `1f1583e`

O fluxo legado foi substituído por `Controller -> UseCase -> Port -> Adapter`.
O adapter Prisma valida o destino no escopo da fazenda e executa atualização
condicional da origem e criação do histórico numa transação curta
`Serializable`. Conflitos/deadlocks `P2034` recebem no máximo três tentativas;
outros erros não são repetidos. A comparação da origem persistida impede lost
update e faz a segunda movimentação concorrente falhar sem criar uma cadeia
inconsistente.

Os testes de adapter, controller e integração de concorrência de pasto foram
adicionados no próprio GREEN, e não no RED `143c7b6`. Portanto, eles forneceram
cobertura posterior, mas não constituíram um ciclo RED válido para rollback e
concorrência. A revisão também identificou envelope paginado aninhado,
`P2034` crua após o último retry e ausência de provas equivalentes para lote.

### RED corretivo — `ea54912`

O ciclo corretivo adicionou antes da produção:

- teste do interceptor exigindo itens em `data` e paginação em `meta`;
- contrato OpenAPI exigindo `data` como array e metadados canônicos;
- teste exigindo normalização da terceira `P2034` como `DomainError`;
- rollback explícito quando `animal.updateMany` falha;
- adapter atômico e concorrência persistida também para lote.

Resultados RED observados:

```text
interceptor + adapter      2 FAIL, 6 PASS
contract movement OpenAPI  1 FAIL
integration pasto+lote     2/2 PASS (comportamento atômico já existia)
```

As falhas foram, respectivamente, o envelope `{data:{data,...}}`, o schema
OpenAPI referenciando `MovementHistoryPageResponseDto` dentro de `data` e o
erro Prisma `P2034` sendo relançado sem normalização. A integração usou e
removeu o banco filho `gado_wave00_test_e56743479c1e`.

### GREEN corretivo — este commit

O interceptor global agora reconhece o resultado paginado canônico e publica
a lista diretamente em `data`, com `page`, `pageSize`, `totalItems` e
`totalPages` em `meta` junto ao `requestId`. O decorador OpenAPI existente foi
estendido para descrever o mesmo envelope, sem resposta alternativa. Após três
tentativas, `P2034` é convertida em `DomainError` com código estável `conflict`,
mensagem pública e causa apenas interna.

```text
movements focais                              19/19 PASS
unit completa                               334/334 PASS
atomic movement integration                    2/2 PASS
architecture                                  23/23 PASS
contract                                      20/20 PASS
no-skipped                                          PASS
lint:check                                          PASS
build                                               PASS
```

A integração GREEN usou o banco filho
`gado_wave00_test_13bde878b766`, removido pelo runner após a execução.
Nenhum `db push`, `migrate reset` ou banco/schema não descartável foi usado.
As rotas legadas e suas entradas na quarentena foram removidas.

## Próximo RED

Task 6.4: transferência de animais entre fazendas autorizadas.
