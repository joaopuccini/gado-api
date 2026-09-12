# ADR 0002: Quarentena transitória das rotas legadas

**Status:** accepted

**Responsável:** Gado engineering

## Contexto

Os controllers atuais antecedem a arquitetura hexagonal, o contrato único e a cobertura obrigatória. Reescrevê-los junto com a fundação impediria ciclos TDD pequenos e misturaria mudanças funcionais com infraestrutura.

## Decisão

Os controllers enumerados em `test/fixtures/legacy-route-quarantine.json` ficam congelados até a onda indicada. Eles podem receber somente correção de segurança necessária para manter a fundação global; não podem receber endpoint ou comportamento funcional novo.

Todo controller novo deve cumprir imediatamente a Rule canônica. O gate arquitetural rejeita novas entradas na quarentena e exige que a lista apenas diminua.

## Remoção

A exceção de cada controller termina quando a respectiva onda obtiver GREEN, cobertura e aceite funcional. O ADR deixa de produzir efeito quando a lista ficar vazia.

## Riscos controlados

- dívida antiga continua visível, versionada e com onda responsável;
- código novo não herda os atalhos do legado;
- cada migração reduz a superfície excepcional até chegar a zero.
