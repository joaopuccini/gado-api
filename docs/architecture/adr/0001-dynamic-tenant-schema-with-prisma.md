# ADR 0001: Schema dinâmico por tenant com Prisma

- Status: accepted
- Data: 2026-09-12
- Escopo: fundação multi-tenant do `gado-api`

## Contexto

O produto usa um schema PostgreSQL dedicado por tenant. O client legado alterava SQL gerado pelo Prisma por substituição textual, mantinha um client default e podia continuar sem contexto de tenant. Esse comportamento não oferece uma fronteira de isolamento auditável.

## Decisão

Cada schema de tenant será representado por `TenantSchemaName`, cujo único formato aceito é `tenant_` seguido por 32 caracteres hexadecimais minúsculos. A `TenantPrismaClientFactory` cria um adapter `PrismaPg` dedicado com a opção suportada `{ schema }` e pool limitado a duas conexões.

Não haverá:

- substituição textual de SQL;
- alteração global ou compartilhada de `search_path`;
- fallback para `public`, `gado_admin` ou client default;
- criação de client a partir de nome não validado;
- reutilização do client de um tenant para outro.

## Evidência

O teste `tenant-prisma-client.factory.integration-spec.ts` foi executado contra PostgreSQL real. Ele criou dois schemas descartáveis, inseriu marcadores diferentes na mesma tabela lógica e confirmou que:

- o client A leu apenas `tenantA`;
- o client B leu apenas `tenantB`;
- nenhuma query observada referenciou `public`;
- nenhuma query observada executou `SET search_path`.

Comando de validação: `npm run test:integration -- tenant-prisma-client.factory.integration-spec.ts`.

## Consequências

Cada tenant ativo pode manter até duas conexões em seu pool. A camada de cache deve possuir limite, expiração e descarte explícito. Provisionamento e migrations devem gerar os nomes no servidor e nunca derivá-los de subdomínio ou entrada do cliente. O próximo passo é substituir o `TenantPrismaService` legado pela factory aprovada e torná-lo fail-closed.
