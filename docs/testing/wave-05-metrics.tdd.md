# Evidências TDD — Onda 05 Pesagens e dashboard real

Data de fechamento: 2026-09-27

## Pares RED/GREEN

| Entrega | RED | GREEN | Evidência principal |
|---|---|---|---|
| Domínio de pesagens | `8377344` | `4c2091a` | regras e cálculos focais 22/22 |
| Casos de uso | `08a6b75` | `f147f4f` | fluxo auditável e contexto tenant |
| Persistência atômica | `1f8882a` | `d89f167` | migrations e transações descartáveis |
| API de pesagens | `2c795f2` | `7ee2df1` | controller 7/7 e contrato |
| Read model | `e19ba5e` | `50baf5c` | fixture zootécnica persistida |
| CEPEA | `c758dd3` | `978a25a` | timeout, cache e fallback 9/9 |
| Dashboard HTTP | `5275685` | `e625035` | contrato 19/19 e legado removido |
| Jornadas web | `d5198b5` | `a7431cd` | focais/E2E 10/10 |
| Reconciliação final | `ae8acef` | `d091ee1` | animal inativo excluído de GMD/evolução |

## Gate final da API

```text
lint/build             exit 0
unit                    58 suites / 300 testes
architecture             6 suites / 23 testes
contract                 4 suites / 19 testes
integration              3 suites / 3 testes
isolation                8 suites / 16 testes
migrations               3 suites / 3 testes
coverage                73 suites / 338 testes
no-skipped              exit 0
```

Cobertura API: 90,32% statements, 82,61% branches, 85,07% functions e
91,59% lines.

## Gate final do frontend

```text
contracts/lint/types    exit 0
architecture             2 arquivos / 7 testes
coverage                32 arquivos / 118 testes
build app/admin         exit 0
network/bundles         exit 0
```

Cobertura web: 90,77% statements, 83,78% branches, 91,26% functions e 92,37%
lines. A cobertura foi executada com `--maxWorkers=1` para respeitar o limite
de memória local, sem alterar seleção, thresholds ou resultados.

## Persistência descartável

Somente bancos filhos `gado_wave00_test_<12hex>` foram usados nos gates. Os
bancos finais `gado_wave00_test_66da4d114b6a`,
`gado_wave00_test_d804f65a7ab8`, `gado_wave00_test_1512fff09452` e
`gado_wave00_test_a75b66ae93be` foram removidos automaticamente. Não houve
`db push`, `migrate reset` ou reset de banco/schema persistente.
