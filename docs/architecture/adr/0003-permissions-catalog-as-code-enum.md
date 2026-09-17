# ADR-0003: Catálogo de permissões como enum em código com IDs estáveis

**Status:** Aprovado  
**Data:** 2026-09-16  
**Autor:** João Puccini  
**Onda de execução:** 02 (Identidade, RBAC e Provisionamento)

## Contexto

O sistema legado e o schema tenant atual armazenam a lista de permissões disponíveis na tabela `permissoes` de cada schema tenant. Para cada tenant provisionado, é necessário executar INSERTs manuais ou scripts de seed para popular essa tabela e depois vincular as permissões aos perfis-base via `perfil_permissao`.

Problemas identificados:

1. **Drift entre tenants** — se um tenant foi provisionado antes de uma nova permissão ser adicionada, ele não a possui até um sync manual.
2. **Seed manual repetitivo** — cada provisioning precisa de dezenas de INSERTs idênticos.
3. **Fonte de verdade ambígua** — permissões já estão definidas em `rbac.config.ts` (enums `AppModule`, `AppAction`, `FazendaRole` e matriz `RolePermissions`), mas o banco tem sua própria lista potencialmente diferente.
4. **Sem descrição ou documentação viva** — a tabela `permissoes` tem campos `nome`, `descricao`, `modulo` e `categoria`, mas eles são preenchidos por scripts avulsos e raramente refletem a realidade.

O projeto `epi-management-api` resolve parcialmente com um script `sync-permissoes-4-controllers-full` que varre `@RequirePermissions` dos controllers e sincroniza com o banco admin, iterando depois todos os tenants. Porém, a lista canônica ainda vive no banco.

## Decisão

O **catálogo de permissões** será definido como um **enum/constante em código** (`PERMISSIONS_CATALOG`) com **IDs numéricos estáveis**, sendo a única fonte de verdade para quais permissões existem no sistema.

As tabelas de **vínculo** (`perfil_permissao`, `usuario_permissao`) e a tabela de **perfis** (`perfis`) serão **mantidas** no schema tenant para permitir que o proprietário da fazenda crie perfis customizados e atribua combinações de permissões a gosto.

### Estrutura do catálogo

```typescript
// src/common/rbac/permissions-catalog.ts

export interface PermissionEntry {
  readonly id: number;
  readonly code: string;          // 'animais:ler'
  readonly module: AppModule;
  readonly action: AppAction;
  readonly label: string;         // 'Visualizar animais'
  readonly description: string;   // 'Listar e detalhar cadastro de animais da fazenda'
}

export const PERMISSIONS_CATALOG: readonly PermissionEntry[] = [
  { id: 1,  code: 'animais:ler',       module: AppModule.ANIMAIS, action: AppAction.LER,      label: 'Visualizar animais',  description: 'Listar e detalhar cadastro de animais da fazenda' },
  { id: 2,  code: 'animais:criar',     module: AppModule.ANIMAIS, action: AppAction.CRIAR,    label: 'Cadastrar animal',    description: 'Criar novo animal ou registrar compra' },
  { id: 3,  code: 'animais:editar',    module: AppModule.ANIMAIS, action: AppAction.EDITAR,   label: 'Editar animal',       description: 'Alterar dados de animal existente' },
  { id: 4,  code: 'animais:excluir',   module: AppModule.ANIMAIS, action: AppAction.EXCLUIR,  label: 'Excluir animal',      description: 'Dar baixa ou remover animal' },
  { id: 5,  code: 'animais:gerenciar', module: AppModule.ANIMAIS, action: AppAction.GERENCIAR,label: 'Gerenciar animais',   description: 'Acesso total ao módulo de animais' },
  // ... demais permissões, cada uma com ID fixo e incremental
] as const;
```

### Perfis-base com defaults

```typescript
// src/common/rbac/default-profiles.ts

export const DEFAULT_PROFILE_PERMISSIONS: Record<FazendaRole, number[]> = {
  DONO:         [1, 2, 3, 4, 5, /* ... todos os IDs */],
  GESTOR:       [1, 2, 3, 4, 5, /* ... quase todos */],
  COLABORADOR:  [1, 2, 3, /* ... subset operacional */],
  VETERINARIO:  [1, /* ... subset saúde */],
  CONSULTOR:    [1, /* ... só leitura */],
};
```

### O que fica no banco (schema tenant)

| Tabela | Mantida | Função |
|---|---|---|
| `permissoes` | ✅ Sim | Espelho do `PERMISSIONS_CATALOG`, auto-populada no provisioning/sync |
| `perfis` | ✅ Sim | Perfis-base (DONO, GESTOR, etc.) + perfis customizados pelo proprietário |
| `perfil_permissao` | ✅ Sim | Vínculo perfil ↔ permissões (defaults + customizações) |
| `usuario_permissao` | ✅ Sim | Override de permissão direta por usuário |

### Fluxos

#### Provisioning de novo tenant

1. Criar schema e aplicar migrations.
2. **Sync automático:** ler `PERMISSIONS_CATALOG` e fazer `upsert` na tabela `permissoes` usando o ID estável como chave.
3. Criar os perfis-base a partir de `DEFAULT_PROFILE_PERMISSIONS`.
4. Inserir `perfil_permissao` para cada perfil-base com seus IDs de permissão.

#### Adicionar nova permissão

1. Adicionar entrada no `PERMISSIONS_CATALOG` com o próximo ID sequencial.
2. Atualizar `DEFAULT_PROFILE_PERMISSIONS` se a permissão pertence a algum perfil-base.
3. Deploy → sync automático popula todos os tenants na próxima execução do sync.

#### Proprietário cria perfil customizado

1. Frontend lê o catálogo via `GET /permissions/catalog` (endpoint que expõe o `PERMISSIONS_CATALOG` agrupado por módulo).
2. Proprietário seleciona as permissões desejadas.
3. Backend cria registro em `perfis` e insere em `perfil_permissao` os IDs selecionados.
4. Proprietário atribui o perfil ao usuário.

### Endpoint de catálogo

```typescript
@Get('catalog')
@RequirePermissions('configuracoes:ler')
@ApiOperation({ summary: 'Catálogo completo de permissões do sistema' })
getCatalog() {
  return { data: groupByModule(PERMISSIONS_CATALOG) };
}
```

### Script de validação (inspirado no sync do EPI)

Um script/teste varre todos os `@RequirePermissions` dos controllers e compara com `PERMISSIONS_CATALOG`:

- **Permissão usada mas ausente do catálogo** → falha (órfã).
- **Permissão no catálogo mas nunca usada** → warning (pode ser permissão de UI/menu).
- **ID duplicado no catálogo** → falha.
- **Código duplicado no catálogo** → falha.

Esse teste faz parte do gate de arquitetura (já existe precedente no gate da Onda 00).

## Regras

1. **IDs são imutáveis** — uma vez atribuído um ID numérico a uma permissão, ele nunca muda e nunca é reutilizado, mesmo que a permissão seja descontinuada.
2. **Novos IDs são sempre incrementais** — nunca preencher "buracos" de IDs removidos.
3. **O enum é a fonte de verdade** — a tabela `permissoes` é um espelho; qualquer divergência é corrigida pelo sync, nunca pelo banco.
4. **Perfis-base são recriáveis** — o sync pode recriar os perfis-base e seus vínculos sem afetar perfis customizados (IDs de perfis-base são reservados, ex: 1–5).
5. **Perfis customizados são dados do tenant** — nunca sobrescritos pelo sync.

## Consequências

### Positivas

- **Zero drift entre tenants** — todos recebem o mesmo catálogo.
- **Provisioning mais simples** — sem SQL manual de permissões.
- **Documentação viva** — label e descrição estão no código, sempre atualizados.
- **Type-safe** — `@RequirePermissions` pode validar contra o catálogo em compile-time.
- **Testável** — gate de arquitetura garante consistência entre decorators e catálogo.
- **Customização preservada** — proprietário pode criar perfis sob medida.

### Negativas

- IDs numéricos estáveis exigem disciplina (não reordenar, não reusar).
- Permissões descontinuadas ficam como "mortas" no enum (marcadas com flag `deprecated`).

### Neutras

- A tabela `permissoes` no banco continua existindo — é espelho, não fonte de verdade.
- O sync precisa ser idempotente (upsert por ID).

## Referências

- `epi-management-api/scripts/sync-permissoes-4-controllers-full.ts` — script de referência.
- `epi-management-api/src/usuarios/perfis-marker.controller.ts` — controller de presets de perfil.
- `gado-api/src/common/rbac/rbac.config.ts` — enum existente que será evoluído.
- `gado-api/prisma/tenant/schema.prisma` — tabelas `permissoes`, `perfis`, `perfil_permissao`, `usuario_permissao`.
- `.agent/rules/gado-saas-engineering.md` — regras de banco, contrato e arquitetura.
