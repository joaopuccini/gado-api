# Evidências TDD — Onda 04 Rebanho básico

Data de fechamento: 2026-09-27

## Pares RED/GREEN

| Entrega | RED | GREEN | Evidência principal |
|---|---|---|---|
| Paridade de raças e lotes | `2d2651b` | `5a30abd` | 7/7 focais e arquitetura 23/23 |
| Persistência e HTTP dos catálogos | `3f0845b` | `dbeccf1` | 16/16 focais, contrato 18/18, lint e build |
| Estado ativo e isolamento dos catálogos | `e202477` | `c4c82f5` | adapter 4/4 e concorrência 1/1 |
| Domínio e contrato camelCase de animais | `bbaf18b` | `84e12d4` | use case 5/5 e arquitetura 23/23 |
| Brinco único e compra transacional | `b16eed4` | `d64bb31` | adapter 8/8 e migrations limpa/upgrade |
| API autenticada de animais | `aea4342` | `e507469` | controller 8/8, contrato 18/18 e build |
| Cliente web gerado | `f44043b` | `50d511f` | cliente 3/3, contracts, network e typecheck |
| Páginas de raças e lotes | `7f572f9` | `213b03e` | páginas 6/6 e router/layout 3/3 |
| Jornada de animais | `8c1dc25` | `f8d1dee` | focais/E2E/cliente 26/26 e router 2/2 |
| Isolamento concorrente de animais | `ef8b35f` | não necessário | comportamento já correto; persistência real 2/2, sem alteração artificial de produção |

O contrato OpenAPI foi publicado em `deb914c`; a nulabilidade dos campos de
animal foi corrigida na fonte em `fb6d538`. A correção do cliente central para
invocar `crypto.randomUUID()` com contexto válido está incluída em `f8d1dee` e
é exercitada pelo E2E da jornada.

## Gate final da API

```text
lint:check              exit 0
build                   exit 0
unit                    48 suites / 243 testes
architecture             6 suites / 23 testes
contract                 3 suites / 18 testes
integration              2 suites / 2 testes
isolation                7 suites / 14 testes
migrations               3 suites / 3 testes
coverage                61 suites / 278 testes
no-skipped              exit 0
```

Cobertura da API: 90,32% statements, 82,61% branches, 85,07% functions e
91,59% lines.

## Gate final do frontend

```text
contracts/lint/types    exit 0
architecture             2 arquivos / 7 testes
coverage                29 arquivos / 114 testes
build app/admin         exit 0
network/bundles         exit 0
```

Cobertura web: 89,71% statements, 83,60% branches, 90,74% functions e 91,36%
lines.

## Persistência descartável

Somente bancos filhos com padrão `gado_wave00_test_<12hex>` foram usados. Os
bancos finais `gado_wave00_test_ec842afd168c`,
`gado_wave00_test_76344a6821a2`, `gado_wave00_test_9bb24ae21e60` e
`gado_wave00_test_2d115524eb84` foram removidos automaticamente. O banco focal
`gado_wave00_test_72d38bc756a3` também foi removido. Não houve `db push`,
`migrate reset` ou reset de banco/schema persistente.
