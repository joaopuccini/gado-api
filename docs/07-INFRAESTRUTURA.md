# ⚙️ Infraestrutura — Middleware, Interceptors, Filters e Context

> Detalha os componentes de infraestrutura NestJS que sustentam a aplicação.

---

## 1. Pipeline de Request

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                     Pipeline NestJS                     │
                     │                                                         │
Request ──► Middleware ──► Guards ──► Interceptors (before) ──► Controller     │
                     │                                             │           │
                     │                                         Service         │
                     │                                             │           │
                     │        Interceptors (after) ◄── Controller return       │
                     │                                                         │
                     │        Exception Filter ◄── (se erro em qualquer ponto) │
                     └─────────────────────────────────────────────────────────┘
```

---

## 2. Middlewares

### 2.1 TenantMiddleware
**Arquivo**: [`tenant.middleware.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/tenant/tenant.middleware.ts)

- **Quando**: Toda request
- **O que faz**: Resolve o `tenantId` e `schemaName` via header `X-Tenant-ID` ou subdomain
- **Detalhes**: Ver [02-MULTI-TENANT.md](./02-MULTI-TENANT.md)

### 2.2 RequestContextMiddleware
**Arquivo**: [`request-context.middleware.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/middleware/request-context.middleware.ts)

- **Quando**: Toda request
- **O que faz**: Inicia o `AsyncLocalStorage` com dados iniciais do request (path, method, startTime)
- **Importância**: Garante isolamento de contexto por request, mesmo sob alta concorrência

---

## 3. Guards (Ordem de Execução)

### 3.1 JwtAuthGuard (por rota)
**Arquivo**: [`jwt-auth.guard.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/auth/guards/jwt-auth.guard.ts)

- Valida o Bearer token via `passport-jwt`
- Extrai payload → popula `request.user`
- Preenche `RequestContext` com dados do JWT

### 3.2 SubscriptionGuard (global)
**Arquivo**: [`subscription.guard.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/admin/guards/subscription.guard.ts)

- Verifica se a organização do tenant tem assinatura ativa
- Bloqueia com `403` se org está `SUSPENSA` ou assinatura expirou
- Usa cache em memória com TTL para evitar query por request

### 3.3 ThrottlerGuard (global)
- Rate limiting: 100 requests por 60 segundos (configurável)
- Protege contra DDoS e brute-force

### 3.4 PermissionsGuard (por rota)
**Arquivo**: [`permissions.guard.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/auth/guards/permissions.guard.ts)

- Verifica se o JWT do usuário contém a permissão exigida pelo `@RequirePermissions()`
- Formato: `modulo:acao` (ex: `animais:criar`)
- DONO tem bypass total

---

## 4. Interceptors

### 4.1 LoggingInterceptor (global)
**Arquivo**: [`logging.interceptor.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/interceptors/logging.interceptor.ts)

- **Before**: Loga `INIT PROCESS` com path, method, body e query params
- **After**: Loga `END PROCESS` com duração, status code e tamanho da response
- Usa `RequestContext` para enriquecer logs com tenantId, userId, etc.

### 4.2 HierarchyInterceptor (global)
**Arquivo**: [`hierarchy.interceptor.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/interceptors/hierarchy.interceptor.ts)

- **Quando**: Antes de cada Controller
- **O que faz**: Se a fazenda selecionada é uma Matriz (tem filhas), expande `accessibleFazendaIds` para incluir todas as filhas
- **Detalhes**: Ver [04-HIERARQUIA-FAZENDAS.md](./04-HIERARQUIA-FAZENDAS.md)

---

## 5. Exception Filter

### AllExceptionsFilter (global)
**Arquivo**: [`all-exceptions.filter.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/filters/all-exceptions.filter.ts)

Captura **toda exceção** não tratada e formata a resposta:

```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Mensagem da exceção",
  "path": "/animais",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Logs de exceção incluem stack trace completo para debugging.

---

## 6. AsyncLocalStorage (RequestContext)

**Arquivo**: [`request-context.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/context/request-context.ts)

### O que é?
`AsyncLocalStorage` do Node.js — armazena dados por request sem passar parâmetros explícitos entre funções.

### Por que usar?
- **Thread-safety**: Cada request tem seu próprio contexto isolado
- **Zero race conditions**: Mesmo com milhares de requests simultâneas
- **Clean code**: Services acessam `RequestContext.getFazendaId()` sem receber parâmetros

### Dados disponíveis:
| Método Estático | Retorna | Uso |
|---|---|---|
| `RequestContext.getSchemaName()` | `string` | Qual schema Prisma usar |
| `RequestContext.getFazendaId()` | `number` | Fazenda selecionada |
| `RequestContext.getAccessibleFazendaIds()` | `number[]` | Fazendas acessíveis (visão matriz) |
| `RequestContext.getUserId()` | `number` | ID do UsuarioLocal |
| `RequestContext.getGlobalUserId()` | `string` | UUID do UsuarioGlobal |
| `RequestContext.getTenantId()` | `string` | UUID da Organização |
| `RequestContext.getRequestId()` | `string` | UUID do request (tracing) |

---

## 7. Decorators Customizados

| Decorator | Arquivo | O que extrai |
|---|---|---|
| `@CurrentUser()` | [`current-user.decorator.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/decorators/current-user.decorator.ts) | Payload completo do JWT de `request.user` |
| `@CurrentFazenda()` | [`current-fazenda.decorator.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/decorators/current-fazenda.decorator.ts) | `fazendaId` do `request.user` ou `RequestContext` |
| `@RequirePermissions(mod, act)` | [`roles.decorator.ts`](file:///c:/Users/Joao%20Puccini/Desktop/repositorios-git/gado/gado-api/src/common/decorators/roles.decorator.ts) | Metadata `SetMetadata('permissions', ...)` |

---

## 8. Configuração (app.module.ts)

```typescript
// Providers globais registrados no AppModule:
{
  provide: APP_FILTER,      useClass: AllExceptionsFilter
  provide: APP_INTERCEPTOR, useClass: LoggingInterceptor
  provide: APP_INTERCEPTOR, useClass: HierarchyInterceptor
  provide: APP_GUARD,       useClass: ThrottlerGuard
  provide: APP_GUARD,       useClass: SubscriptionGuard
}
```

**Nota**: `JwtAuthGuard` e `PermissionsGuard` **não são globais** — são aplicados por rota via `@UseGuards()` e `@RequirePermissions()`.

---

## 9. Segurança (main.ts)

```typescript
// Helmet — headers de segurança HTTP
app.use(helmet());

// CORS — origens permitidas
app.enableCors({ origin: [...], credentials: true });

// Validation Pipe — validação automática de DTOs
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,        // remove campos não declarados no DTO
  forbidNonWhitelisted: true, // rejeita campos extras
  transform: true,        // auto-transforma tipos
}));

// Rate Limiting — ThrottlerModule
ThrottlerModule.forRoot({ ttl: 60, limit: 100 })
```
