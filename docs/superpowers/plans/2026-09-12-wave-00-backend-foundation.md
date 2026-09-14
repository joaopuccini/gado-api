# Wave 00 Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação obrigatória do `gado-api` para que todos os módulos seguintes nasçam com isolamento tenant fail-closed, arquitetura hexagonal, contratos `camelCase`, observabilidade global, migrations reproduzíveis e gates TDD.

**Architecture:** Um único `ExecutionContextStore` inicia no primeiro middleware e é enriquecido apenas por identidades verificadas. Cross-cutting concerns são providers globais `APP_PIPE`, `APP_INTERCEPTOR` e `APP_FILTER`; domínio e UseCases não dependem de HTTP, Prisma ou providers externos. A estratégia Prisma/schema é bloqueada por um spike de integração PostgreSQL antes de substituir o acesso existente.

**Tech Stack:** NestJS 11, TypeScript, Prisma 7, `@prisma/adapter-pg`, PostgreSQL, AsyncLocalStorage, Jest, Supertest e OpenAPI.

---

## 1. Preconditions e jornadas

Preconditions de execução:

- branch/worktree exclusivo criado a partir de `gado-api/main`;
- `TEST_DATABASE_URL` aponta para PostgreSQL descartável e não contém credencial de produção;
- `DATABASE_URL` produtiva não é usada por nenhum teste;
- Docker, se usado para o banco descartável, é iniciado por comando revisado pelo operador;
- cada commit RED e GREEN é confirmado como ancestral do `HEAD` da branch da onda.

Jornadas técnicas que os testes devem garantir:

1. Como operador, quero correlacionar qualquer request do início ao fim sem expor credenciais.
2. Como cliente A, quero que uma request concorrente do cliente B nunca altere meu contexto ou meus dados.
3. Como backend, quero rejeitar acesso operacional sem tenant autenticado em vez de cair em schema default.
4. Como consumidor da API, quero um único envelope `camelCase` para sucesso, validação, domínio e erro inesperado.
5. Como desenvolvedor, quero que todo input passe pelo mesmo pipe e toda rota nova apareça corretamente no OpenAPI.
6. Como operador SaaS, quero criar e atualizar schemas tenant pela mesma cadeia de migrations, com retry e checksum.
7. Como mantenedor, quero que CI impeça Controller -> Prisma, UseCase -> framework e imports entre repositories de módulos.

## 2. Mapa de arquivos da onda

### Criar

```text
src/common/context/execution-context.store.ts
src/common/context/execution-context.store.spec.ts
src/common/context/execution-context.middleware.ts
src/common/context/context.module.ts
src/common/errors/domain-error.ts
src/common/errors/error-catalog.ts
src/common/errors/error-http.mapper.ts
src/common/errors/global-exception.filter.spec.ts
src/common/logger/structured-logger.service.ts
src/common/logger/structured-logger.service.spec.ts
src/common/logger/log-redactor.ts
src/common/interceptors/logging.interceptor.spec.ts
src/common/pipes/global-validation.pipe.ts
src/common/pipes/global-validation.pipe.spec.ts
src/common/contracts/api-envelope.ts
src/common/contracts/api-error.dto.ts
src/common/contracts/api-meta.dto.ts
src/common/contracts/api-success.dto.ts
src/identity-access/application/ports/tenant-registry.repository.ts
src/identity-access/application/use-cases/resolve-tenant-context.use-case.ts
src/identity-access/application/use-cases/resolve-tenant-context.use-case.spec.ts
src/identity-access/infrastructure/prisma-tenant-registry.repository.ts
src/tenant/infrastructure/schema-name.ts
src/tenant/infrastructure/schema-name.spec.ts
src/tenant/infrastructure/tenant-prisma-client.factory.ts
src/tenant/infrastructure/tenant-prisma-client.factory.integration-spec.ts
src/tenant/tenant-prisma.service.spec.ts
src/tenant-provisioning/application/ports/tenant-migration.repository.ts
src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case.ts
src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case.spec.ts
src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository.ts
src/tenant-provisioning/infrastructure/tenant-migration.loader.ts
test/contracts/global-http-contract.e2e-spec.ts
test/contracts/openapi-completeness.e2e-spec.ts
test/isolation/execution-context-concurrency.e2e-spec.ts
test/isolation/tenant-prisma-isolation.e2e-spec.ts
test/migrations/admin-empty-database.e2e-spec.ts
test/migrations/tenant-empty-schema.e2e-spec.ts
test/migrations/tenant-upgrade.e2e-spec.ts
test/architecture/hexagonal-boundaries.spec.ts
test/architecture/ci-workflow.spec.ts
test/fixtures/legacy-route-quarantine.json
test/jest-contract.json
test/jest-integration.json
test/jest-isolation.json
test/jest-architecture.json
test/jest-migrations.json
scripts/assert-no-skipped-tests.mjs
docs/architecture/adr/0001-dynamic-tenant-schema-with-prisma.md
docs/architecture/adr/0002-legacy-route-quarantine.md
docs/testing/wave-00-backend-foundation.tdd.md
.github/workflows/ci.yml
```

### Modificar

```text
package.json
package-lock.json
src/main.ts
src/app.module.ts
src/auth/strategies/jwt.strategy.ts
src/tenant/tenant.module.ts
src/tenant/tenant-prisma.service.ts
src/common/interceptors/logging.interceptor.ts
src/common/interceptors/transform.interceptor.ts
src/common/filters/global-exception.filter.ts
src/common/context/index.ts
src/common/interceptors/index.ts
src/common/filters/index.ts
prisma.config.ts
prisma/schema.prisma
prisma/schema-admin.prisma
```

### Remover somente depois de todos os imports migrarem

```text
src/tenant/tenant.context.ts
src/tenant/tenant.middleware.ts
src/tenant/tenant.middleware.spec.ts
src/common/context/request-context.ts
src/common/context/request-context.middleware.ts
src/common/filters/all-exceptions.filter.ts
src/common/logger/app-logger.ts
src/common/logger/custom-logger.service.ts
src/common/interceptors/hierarchy.interceptor.ts
```

## 3. Task 1 — Baseline, scripts e quarentena mensurável

**Files:**

- Modify: `package.json`
- Create: `test/jest-contract.json`
- Create: `test/jest-integration.json`
- Create: `test/jest-isolation.json`
- Create: `test/jest-architecture.json`
- Create: `test/jest-migrations.json`
- Create: `docs/architecture/adr/0002-legacy-route-quarantine.md`
- Create: `test/fixtures/legacy-route-quarantine.json`

- [x] **Step 1: Registrar a linha de base sem alterar código**

Run:

```powershell
cd gado-api
npm test -- --runInBand
npm run build
npx eslint "{src,apps,libs,test}/**/*.ts"
```

Expected: testes e build registram seu estado real; o lint pode falhar, mas não pode usar `--fix`. Copiar somente totais e nomes de falhas para o relatório TDD, sem secrets ou URLs.

- [x] **Step 2: Adicionar scripts determinísticos**

Adicionar a `package.json`:

```json
{
  "scripts": {
    "lint:check": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test:unit": "jest",
    "test:integration": "jest --config ./test/jest-integration.json",
    "test:contract": "jest --config ./test/jest-contract.json",
    "test:isolation": "jest --config ./test/jest-isolation.json",
    "test:architecture": "jest --config ./test/jest-architecture.json",
    "test:migrations": "jest --config ./test/jest-migrations.json",
    "test:no-skipped": "node scripts/assert-no-skipped-tests.mjs"
  }
}
```

Cada config usa `rootDir: ".."`, `testEnvironment: "node"`, `ts-jest` e um `testRegex` exclusivo para seu diretório. `scripts/assert-no-skipped-tests.mjs` percorre arquivos `*.spec.ts`/`*.e2e-spec.ts`, encerra com código `1` ao encontrar `describe.skip`, `it.skip`, `test.skip`, `xdescribe`, `xit` ou `xtest`, e com código `0` quando não encontra nenhum. O CI executa `npm run test:no-skipped`.

- [x] **Step 3: Criar quarentena somente para controllers preexistentes**

`legacy-route-quarantine.json` deve conter objetos completos:

```json
[
  {
    "controller": "AnimaisController",
    "removalWave": "04",
    "reason": "Contrato e arquitetura legados serão substituídos pelo fluxo vertical de rebanho"
  }
]
```

Gerar uma entrada para cada controller existente e fixar a onda usando o plano mestre. O teste arquitetural da Task 10 falha se uma entrada nova aparecer, se `removalWave` for inválida ou se um controller novo entrar na quarentena.

- [x] **Step 4: Registrar o ADR da exceção transitória**

O ADR deve declarar: status `accepted`, responsável `Gado engineering`, condição de remoção “quando a onda indicada ficar GREEN”, proibição de adicionar comportamento aos controllers em quarentena e obrigação de reduzir a lista a cada onda.

- [x] **Step 5: Commit**

```powershell
git add package.json package-lock.json test docs/architecture/adr/0002-legacy-route-quarantine.md
git commit -m "chore: establish migration quality gates"
```

## 4. Task 2 — Contexto único com AsyncLocalStorage

**Files:**

- Create: `src/common/context/execution-context.store.ts`
- Create: `src/common/context/execution-context.store.spec.ts`
- Create: `src/common/context/execution-context.middleware.ts`
- Create: `src/common/context/context.module.ts`
- Create: `src/common/errors/domain-error.ts`
- Create: `src/common/errors/error-catalog.ts`
- Modify: `src/common/context/index.ts`
- Modify: `src/app.module.ts`

- [x] **Step 1: Escrever testes RED de contexto ausente e concorrência**

Testes obrigatórios:

```typescript
const contextFor = (tenantId: string): ExecutionContextData => ({
  requestId: `request-${tenantId}`,
  traceId: `trace-${tenantId}`,
  contextType: 'tenant',
  startedAt: Date.now(),
  tenantId,
  organizationId: `organization-${tenantId}`,
  schemaName: `tenant_${tenantId.toLowerCase()}`,
  globalUserId: `global-${tenantId}`,
  localUserId: 1,
  farmId: 1,
  accessibleFarmIds: [1],
  permissions: ['animals.read'],
});

const store = new ExecutionContextStore();

describe('ExecutionContextStore', () => {
  it('fails closed when tenant context is required but absent', () => {
    try {
      store.requireTenant();
      throw new Error('expected requireTenant to fail');
    } catch (error) {
      expect(error).toMatchObject({ code: 'tenantContextMissing' });
    }
  });

  it('keeps two concurrent tenant contexts isolated', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const first = store.run(contextFor('tenantA'), async () => {
      await gate;
      return store.requireTenant().tenantId;
    });
    const second = store.run(contextFor('tenantB'), async () => {
      await gate;
      return store.requireTenant().tenantId;
    });
    release();
    const values = await Promise.all([first, second]);

    expect(values).toEqual(['tenantA', 'tenantB']);
  });
});
```

Run: `npm run test:unit -- execution-context.store.spec.ts`

Expected: FAIL por módulo inexistente; a falha deve ser causada somente pela implementação ausente.

- [x] **Step 2: Commit RED**

```powershell
git add src/common/context/execution-context.store.spec.ts
git commit -m "test: specify isolated execution context"
```

- [x] **Step 3: Implementar a API mínima do store**

Contrato obrigatório:

`src/common/errors/error-catalog.ts` começa com:

```typescript
export type ErrorCode = 'executionContextMissing' | 'tenantContextMissing';
```

`src/common/errors/domain-error.ts` começa com:

```typescript
import type { ErrorCode } from './error-catalog';

export class DomainError extends Error {
  constructor(readonly code: ErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
```

`src/common/context/execution-context.store.ts` contém:

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../errors/domain-error';

export type ContextType = 'admin' | 'tenant' | 'public' | 'job';

export interface ExecutionContextData {
  requestId: string;
  traceId: string;
  contextType: ContextType;
  startedAt: number;
  method?: string;
  path?: string;
  tenantId?: string;
  organizationId?: string;
  schemaName?: string;
  globalUserId?: string;
  localUserId?: number;
  farmId?: number;
  accessibleFarmIds: number[];
  permissions: string[];
}

export interface VerifiedTenantContext {
  tenantId: string;
  organizationId: string;
  schemaName: string;
  globalUserId: string;
  localUserId: number;
  farmId: number;
  accessibleFarmIds: number[];
  permissions: string[];
}

@Injectable()
export class ExecutionContextStore {
  private readonly storage = new AsyncLocalStorage<ExecutionContextData>();

  run<T>(context: ExecutionContextData, callback: () => T): T {
    return this.storage.run(Object.freeze({ ...context }), callback);
  }

  current(): ExecutionContextData | undefined {
    return this.storage.getStore();
  }

  require(): ExecutionContextData {
    const context = this.current();
    if (!context) throw new DomainError('executionContextMissing', 'Contexto de execução ausente');
    return context;
  }

  enrichTenant(verified: VerifiedTenantContext): void {
    const current = this.require();
    this.storage.enterWith(Object.freeze({ ...current, ...verified, contextType: 'tenant' }));
  }

  requireTenant(): ExecutionContextData & Required<Pick<ExecutionContextData,
    'tenantId' | 'organizationId' | 'schemaName' | 'globalUserId' | 'localUserId' | 'farmId'>> {
    const context = this.require();
    if (!['tenant', 'job'].includes(context.contextType) || !context.tenantId || !context.schemaName) {
      throw new DomainError('tenantContextMissing', 'Contexto de tenant ausente');
    }
    return context as ExecutionContextData & Required<Pick<ExecutionContextData,
      'tenantId' | 'organizationId' | 'schemaName' | 'globalUserId' | 'localUserId' | 'farmId'>>;
  }
}
```

O arquivo `error-catalog.ts` exporta esses dois códigos iniciais. A Task 3 amplia o catálogo e adiciona o mapeamento HTTP sem alterar sua semântica.

- [x] **Step 4: Implementar o primeiro middleware**

`ExecutionContextMiddleware` valida `x-request-id` como UUID; valor inválido é ignorado e substituído. Ele define o header de resposta e chama `store.run()` com correlação, `contextType: 'public'`, arrays vazios, method/path e `startedAt`.

Registrar somente esse middleware em `AppModule.configure()` antes de qualquer outro middleware.

- [x] **Step 5: Executar GREEN e teste E2E concorrente**

Run:

```powershell
npm run test:unit -- execution-context.store.spec.ts
npm run test:isolation -- execution-context-concurrency.e2e-spec.ts
```

Expected: PASS; cada resposta conserva seu próprio `requestId` e tenant, mesmo com barreira concorrente.

- [x] **Step 6: Commit GREEN**

```powershell
git add src/common/context src/app.module.ts test/isolation
git commit -m "feat: add fail-closed execution context"
```

## 5. Task 3 — Domínio de erros e filtro global único

**Files:**

- Modify: `src/common/errors/domain-error.ts`
- Modify: `src/common/errors/error-catalog.ts`
- Create: `src/common/errors/error-http.mapper.ts`
- Create: `src/common/errors/global-exception.filter.spec.ts`
- Modify: `src/common/filters/global-exception.filter.ts`
- Modify: `src/common/filters/index.ts`
- Modify: `src/app.module.ts`
- Modify: `src/main.ts`
- Delete: `src/common/filters/all-exceptions.filter.ts`

- [x] **Step 1: Escrever testes RED dos quatro tipos de falha**

Casos e resultados:

```typescript
it.each([
  ['validationFailed', 400],
  ['unauthenticated', 401],
  ['forbidden', 403],
  ['animalNotFound', 404],
])('maps %s to its stable HTTP status', (code, statusCode) => {
  expect(mapDomainErrorToHttp(new DomainError(code))).toMatchObject({ code, statusCode });
});

it('hides an unknown exception', async () => {
  expect(await request(app).get('/probe/unexpected')).toMatchObject({
    status: 500,
    body: {
      error: { code: 'internalServerError', message: 'Erro interno do servidor' },
      meta: { requestId: expect.any(String), path: '/probe/unexpected' },
    },
  });
});
```

Também afirmar ausência de `success`, `statusCode`, `stack`, `sql`, `module` e nomes `UPPER_SNAKE_CASE` no body.

Run: `npm run test:unit -- global-exception.filter.spec.ts`

Expected: FAIL porque o contrato existente inclui `success`, códigos uppercase e detalhes internos.

- [x] **Step 2: Commit RED**

```powershell
git add src/common/errors/global-exception.filter.spec.ts
git commit -m "test: specify global error contract"
```

- [x] **Step 3: Implementar erros independentes de HTTP**

```typescript
export type ErrorCode =
  | 'executionContextMissing'
  | 'validationFailed'
  | 'unauthenticated'
  | 'forbidden'
  | 'resourceNotFound'
  | 'conflict'
  | 'tenantContextMissing'
  | 'tenantUnavailable'
  | 'animalNotFound'
  | 'internalServerError';

export interface ErrorDetail {
  field?: string;
  reason: string;
}

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
```

Erros específicos de módulos estendem `DomainError` e podem ampliar o union por catálogo; nunca recebem status HTTP.

- [x] **Step 4: Consolidar o filtro**

Manter somente `GlobalExceptionFilter`, registrado uma vez por `APP_FILTER`. O filtro normaliza `DomainError`, `HttpException`, erros de validação, Prisma e desconhecidos para:

```typescript
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; reason: string }>;
  };
  meta: {
    requestId: string;
    timestamp: string;
    path: string;
  };
}
```

Remover `app.useGlobalFilters(...)` de `main.ts` e `AllExceptionsFilter` de exports/providers para impedir dupla captura.

- [x] **Step 5: Executar GREEN e commit**

Run: `npm run test:unit -- global-exception.filter.spec.ts`

Expected: PASS nos status, códigos, detalhes de validação e redaction de exceção desconhecida.

```powershell
git add src/common/errors src/common/filters src/app.module.ts src/main.ts
git commit -m "feat: enforce global error domain"
```

## 6. Task 4 — Logger JSON e interceptor global

**Files:**

- Create: `src/common/logger/log-redactor.ts`
- Create: `src/common/logger/structured-logger.service.ts`
- Create: `src/common/logger/structured-logger.service.spec.ts`
- Modify: `src/common/interceptors/logging.interceptor.ts`
- Create: `src/common/interceptors/logging.interceptor.spec.ts`
- Modify: `src/app.module.ts`
- Modify: `src/main.ts`

- [x] **Step 1: Escrever testes RED de estrutura, correlação e redaction**

```typescript
it('writes a correlated JSON record without secrets', () => {
  logger.info('httpRequestStarted', {
    authorization: 'Bearer secret',
    password: 'secret',
    operation: 'listAnimals',
  });

  expect(JSON.parse(sink.lastLine())).toMatchObject({
    level: 'info',
    event: 'httpRequestStarted',
    requestId: 'request-a',
    tenantId: 'tenant-a',
    operation: 'listAnimals',
  });
  expect(sink.lastLine()).not.toContain('Bearer secret');
  expect(sink.lastLine()).not.toContain('"password"');
});
```

O spec do interceptor afirma exatamente um `httpRequestStarted` e um `httpRequestCompleted` em sucesso e erro, com `statusCode`, `durationMs` e `outcome`, sem body/response.

Run: `npm run test:unit -- structured-logger.service.spec.ts logging.interceptor.spec.ts`

Expected: FAIL porque o logger atual é textual e o interceptor usa `Logger` diretamente.

- [x] **Step 2: Commit RED**

```powershell
git add src/common/logger/*.spec.ts src/common/interceptors/logging.interceptor.spec.ts
git commit -m "test: specify structured request observability"
```

- [x] **Step 3: Implementar logger estruturado**

O logger implementa `LoggerService`, aceita um `LogSink` injetável nos testes e emite uma linha JSON por evento. Campos de contexto são obtidos do `ExecutionContextStore`; chaves `authorization`, `cookie`, `password`, `token`, `secret`, `clientSecret` e `refreshToken` são removidas recursivamente.

```typescript
export interface StructuredLogRecord {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  service: 'gadoApi';
  environment: string;
  requestId?: string;
  traceId?: string;
  tenantId?: string;
  organizationId?: string;
  farmId?: number;
  module?: string;
  operation?: string;
  statusCode?: number;
  durationMs?: number;
  outcome?: 'success' | 'error';
  errorCode?: string;
}
```

- [x] **Step 4: Tornar logging uma preocupação interceptada**

Injetar `StructuredLogger` em `LoggingInterceptor`, registrar por `APP_INTERCEPTOR` e usar `tap`/`finalize` para cobrir success/error. O interceptor registra metadados; o filtro registra uma vez o erro normalizado e stack interno. Nenhum deles serializa body ou response.

Substituir `new CustomLogger()` por `app.get(StructuredLogger)` em `main.ts`.

- [x] **Step 5: Executar GREEN e commit**

Run: `npm run test:unit -- structured-logger.service.spec.ts logging.interceptor.spec.ts`

Expected: PASS, duas linhas HTTP por request e nenhum segredo.

```powershell
git add src/common/logger src/common/interceptors src/main.ts src/app.module.ts
git commit -m "feat: add correlated structured logging"
```

## 7. Task 5 — ValidationPipe, envelope de sucesso e contrato E2E

**Files:**

- Create: `src/common/pipes/global-validation.pipe.ts`
- Create: `src/common/pipes/global-validation.pipe.spec.ts`
- Create: `src/common/contracts/api-envelope.ts`
- Create: `src/common/contracts/api-error.dto.ts`
- Create: `src/common/contracts/api-meta.dto.ts`
- Create: `src/common/contracts/api-success.dto.ts`
- Modify: `src/common/interceptors/transform.interceptor.ts`
- Modify: `src/app.module.ts`
- Modify: `src/main.ts`
- Create: `test/contracts/global-http-contract.e2e-spec.ts`

- [x] **Step 1: Escrever testes RED do pipe e envelopes**

O teste define um DTO real:

```typescript
class ProbeInputDto {
  @ApiProperty({ example: 'brinco-100' })
  @IsString()
  @IsNotEmpty()
  earTagNumber!: string;
}
```

Casos obrigatórios:

- input válido é transformado em instância de `ProbeInputDto`;
- propriedade extra retorna `400/validationFailed`;
- tipo inválido produz `details: [{ field: 'earTagNumber', reason: 'isString' }]`;
- sucesso retorna `{ data, meta: { requestId } }` sem `success`;
- `204` não tem body;
- erro segue o contrato da Task 3.

Run:

```powershell
npm run test:unit -- global-validation.pipe.spec.ts
npm run test:contract -- global-http-contract.e2e-spec.ts
```

Expected: FAIL pelos envelopes e tratamento de validação atuais.

- [x] **Step 2: Commit RED**

```powershell
git add src/common/pipes/global-validation.pipe.spec.ts test/contracts/global-http-contract.e2e-spec.ts
git commit -m "test: specify global validation and envelopes"
```

- [x] **Step 3: Implementar o pipe único**

```typescript
@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: false,
    });
  }
}
```

Registrar por `APP_PIPE`. Remover `app.useGlobalPipes(...)` de `main.ts`.

- [x] **Step 4: Implementar envelope único**

`TransformInterceptor` passa `undefined` em `204`; nos demais sucessos produz:

```typescript
export interface ApiSuccessResponse<T> {
  data: T;
  meta: { requestId: string };
}
```

Registrar o interceptor por `APP_INTERCEPTOR`; remover `app.useGlobalInterceptors(...)` de `main.ts` para evitar dupla transformação.

- [x] **Step 5: Executar GREEN e commit**

Run:

```powershell
npm run test:unit -- global-validation.pipe.spec.ts
npm run test:contract -- global-http-contract.e2e-spec.ts
```

Expected: PASS para sucesso, `204`, validação, domínio e erro desconhecido.

```powershell
git add src/common/pipes src/common/contracts src/common/interceptors src/app.module.ts src/main.ts test/contracts
git commit -m "feat: enforce global api contract"
```

## 8. Task 6 — Resolver tenant somente após identidade verificada

**Files:**

- Create: `src/identity-access/application/ports/tenant-registry.repository.ts`
- Create: `src/identity-access/application/use-cases/resolve-tenant-context.use-case.ts`
- Create: `src/identity-access/application/use-cases/resolve-tenant-context.use-case.spec.ts`
- Create: `src/identity-access/infrastructure/prisma-tenant-registry.repository.ts`
- Modify: `src/auth/strategies/jwt.strategy.ts`
- Modify: `src/tenant/tenant.module.ts`
- Modify: `src/common/context/execution-context.store.ts`

- [x] **Step 1: Escrever testes RED de autoridade**

```typescript
it('uses registry schema instead of schemaName claimed by the client', async () => {
  registry.findActiveById.mockResolvedValue(activeTenant({ schemaName: 'tenant_verified' }));

  await useCase.execute({
    verifiedSubject: 'user-a',
    tenantId: 'tenant-a',
    requestedSchemaName: 'tenant_attacker',
    hostTenant: 'tenant-a',
  });

  expect(store.requireTenant().schemaName).toBe('tenant_verified');
});

it.each(['blocked', 'removed', 'provisioning'])('rejects a %s tenant', async (status) => {
  registry.findById.mockResolvedValue(tenant({ status }));
  await expect(useCase.execute(verifiedInput())).rejects.toMatchObject({ code: 'tenantUnavailable' });
});
```

Adicionar casos de tenant JWT divergente do subdomínio/header, membership inexistente e fazenda fora do acesso.

Run: `npm run test:unit -- resolve-tenant-context.use-case.spec.ts`

Expected: FAIL porque o middleware atual decodifica JWT sem verificar e confia em `schemaName` do token.

- [x] **Step 2: Commit RED**

```powershell
git add src/identity-access/application/use-cases/resolve-tenant-context.use-case.spec.ts
git commit -m "test: specify verified tenant authority"
```

- [x] **Step 3: Implementar port e UseCase**

```typescript
export interface TenantRegistryRecord {
  tenantId: string;
  organizationId: string;
  schemaName: string;
  subdomain: string;
  status: 'active' | 'blocked' | 'removed' | 'provisioning';
}

export interface TenantRegistryRepository {
  findById(tenantId: string): Promise<TenantRegistryRecord | null>;
}
```

O UseCase recebe apenas claims já verificadas e hints de transporte mapeados pela strategy. Ele consulta registry/membership/fazenda, compara os hints e chama `store.enrichTenant()` com `schemaName` vindo exclusivamente do registry.

- [x] **Step 4: Alterar JwtStrategy**

Configurar `passReqToCallback: true`; a strategy mapeia Express `Request` para um input primitivo e aciona `ResolveTenantContextUseCase`. É proibido fazer base64 decode manual, aceitar header isolado ou transferir `schemaName` do payload para o store.

Remover `TenantMiddleware` do lifecycle. Rotas públicas usam UseCase próprio na Onda 02; rotas operacionais só obtêm banco depois do JWT verificado.

- [x] **Step 5: Executar GREEN e commit**

Run: `npm run test:unit -- resolve-tenant-context.use-case.spec.ts`

Expected: PASS para registry autoritativo e todas as negações.

```powershell
git add src/identity-access src/auth/strategies/jwt.strategy.ts src/tenant/tenant.module.ts src/common/context
git commit -m "feat: resolve tenant from verified identity"
```

## 9. Task 7 — Spike bloqueante de Prisma com schema dinâmico

**Files:**

- Create: `src/tenant/infrastructure/schema-name.ts`
- Create: `src/tenant/infrastructure/schema-name.spec.ts`
- Create: `src/tenant/infrastructure/tenant-prisma-client.factory.ts`
- Create: `src/tenant/infrastructure/tenant-prisma-client.factory.integration-spec.ts`
- Create: `docs/architecture/adr/0001-dynamic-tenant-schema-with-prisma.md`

Este task é um gate: nenhuma substituição do client atual acontece antes do teste em PostgreSQL real.

- [x] **Step 1: Testar validação do identificador**

```typescript
it.each(['public', 'gado_admin', 'tenant-a', 'tenant_a;drop schema public'])('rejects %s', (value) => {
  expect(() => TenantSchemaName.parse(value)).toThrow('invalidTenantSchemaName');
});

it('accepts a server-generated tenant schema', () => {
  expect(TenantSchemaName.parse('tenant_0123456789abcdef0123456789abcdef').value)
    .toBe('tenant_0123456789abcdef0123456789abcdef');
});
```

Run: `npm run test:unit -- schema-name.spec.ts`

Expected: FAIL por implementação ausente.

- [x] **Step 2: Testar isolamento real do client**

O integration spec cria dois schemas descartáveis com a mesma tabela/campos do menor model Prisma, grava marcadores distintos e cria dois clients pela factory. As asserções obrigatórias são:

```typescript
expect(await clientA.raca.findMany()).toEqual([expect.objectContaining({ nome: 'tenantA' })]);
expect(await clientB.raca.findMany()).toEqual([expect.objectContaining({ nome: 'tenantB' })]);
expect(await clientA.raca.findMany()).not.toContainEqual(expect.objectContaining({ nome: 'tenantB' }));
```

O teste também inspeciona queries capturadas e falha se houver substituição textual de SQL, acesso a `public` ou troca global de `search_path` numa conexão compartilhada.

Run: `npm run test:integration -- tenant-prisma-client.factory.integration-spec.ts`

Expected RED: factory ausente. Depois da implementação mínima, o único GREEN válido é isolamento real nas três asserções.

- [x] **Step 3: Commit RED**

```powershell
git add src/tenant/infrastructure/*.spec.ts src/tenant/infrastructure/*.integration-spec.ts
git commit -m "test: prove dynamic tenant schema isolation"
```

- [x] **Step 4: Implementar candidato mínimo sem SQL rewrite**

A factory aceita somente `TenantSchemaName`, cria pool próprio com conexão limitada e configuração de schema suportada pelo adapter/connection, e retorna client sem default:

```typescript
export interface TenantPrismaClientFactory {
  create(schemaName: TenantSchemaName): Promise<PrismaClient>;
  dispose(schemaName: TenantSchemaName): Promise<void>;
}
```

São proibidos `replace()` sobre query, `$executeRawUnsafe` com valor do usuário, singleton global e retorno de client administrativo/público.

- [x] **Step 5: Aplicar o gate de decisão**

Run: `npm run test:integration -- tenant-prisma-client.factory.integration-spec.ts`

Resultados:

- PASS: registrar no ADR a configuração comprovada, limites de pool, evidência e decisão `accepted`;
- FAIL por limitação Prisma/dynamic schema: não alterar `TenantPrismaService`; registrar `rejected` no ADR e parar a onda para decisão explícita entre banco dedicado por tenant, schema compartilhado com RLS ou repositories SQL com `search_path` transacional.

Esse resultado não pode ser mascarado por mock.

- [x] **Step 6: Commit somente se GREEN**

```powershell
git add src/tenant/infrastructure docs/architecture/adr/0001-dynamic-tenant-schema-with-prisma.md
git commit -m "feat: prove isolated tenant prisma clients"
```

## 10. Task 8 — Client tenant fail-closed

**Files:**

- Modify: `src/tenant/tenant-prisma.service.ts`
- Modify: todos os imports listados por `rg -l "TenantContext|RequestContext|globalTenantPrismaService|getClientForSchema" src`
- Delete: os contextos antigos e `hierarchy.interceptor.ts` depois da migração dos imports

- [x] **Step 1: Escrever testes RED**

Casos:

```typescript
it('refuses database access outside a verified tenant context', () => {
  expect(() => service.getClient()).toThrow('tenantContextMissing');
});

it('selects the client exclusively from current AsyncLocalStorage context', async () => {
  await store.run(tenantContext('tenant_a'), async () => {
    expect(service.getClient()).toBe(clientA);
  });
  await store.run(tenantContext('tenant_b'), async () => {
    expect(service.getClient()).toBe(clientB);
  });
});
```

Run: `npm run test:unit -- tenant-prisma.service.spec.ts`

Expected: FAIL porque o serviço retorna `defaultClient` sem contexto.

- [x] **Step 2: Commit RED**

```powershell
git add src/tenant/tenant-prisma.service.spec.ts
git commit -m "test: require tenant context for database access"
```

- [x] **Step 3: Remover todos os bypasses**

`getClient()` chama `ExecutionContextStore.requireTenant()` e a factory comprovada. Remover `defaultClient`, `getClientForSchema` público, `globalTenantPrismaService`, query interception e todos os `console.*`.

Hierarchy vira uma policy/UseCase na Onda 03; nesta onda, nenhum interceptor consulta banco ou engole erro.

- [x] **Step 4: Migrar imports e executar isolamento**

Run:

```powershell
rg "TenantContext|RequestContext|globalTenantPrismaService|getClientForSchema|executeInTenantSchema" src
npm run test:unit -- tenant-prisma.service.spec.ts
npm run test:isolation -- tenant-prisma-isolation.e2e-spec.ts
```

Expected: `rg` sem ocorrências; testes PASS com dois tenants e duas fazendas concorrentes.

- [x] **Step 5: Commit GREEN**

```powershell
git add src test/isolation
git commit -m "refactor: enforce fail-closed tenant persistence"
```

## 11. Task 9 — Migrations administrativas e tenant reproduzíveis

**Files:**

- Move: `prisma/schema-admin.prisma` -> `prisma/admin/schema.prisma`
- Move: `prisma/schema.prisma` -> `prisma/tenant/schema.prisma`
- Create: `prisma/admin/migrations/*/migration.sql`
- Create: `prisma/tenant/migrations/*/migration.sql`
- Create: `src/tenant-provisioning/application/ports/tenant-migration.repository.ts`
- Create: `src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case.ts`
- Create: `src/tenant-provisioning/application/use-cases/migrate-tenant-schema.use-case.spec.ts`
- Create: `src/tenant-provisioning/infrastructure/postgres-tenant-migration.repository.ts`
- Create: `src/tenant-provisioning/infrastructure/tenant-migration.loader.ts`
- Modify: `prisma.config.ts`
- Test: `test/migrations/*.e2e-spec.ts`

- [x] **Step 1: Escrever testes RED dos três caminhos**

1. Banco vazio cria `gado_admin`, constraints e versão esperada.
2. Schema tenant vazio recebe todas as tabelas, índices, FKs, seeds e checksum.
3. Schema na versão anterior é atualizado uma vez; retry não repete migration.

Run: `npm run test:migrations`

Expected: FAIL porque não há diretórios de migrations.

- [x] **Step 2: Commit RED**

```powershell
git add test/migrations
git commit -m "test: specify reproducible admin and tenant migrations"
```

- [x] **Step 3: Gerar e revisar a migration administrativa**

Usar `prisma migrate dev` somente contra `TEST_DATABASE_URL` descartável e commitar SQL. Produção usará exclusivamente `prisma migrate deploy`. Nenhum teste chama `migrate reset` em banco não descartável.

- [x] **Step 4: Criar cadeia tenant com marcador de identificador**

Migration tenant usa somente o identificador reservado `"__tenant__"`. `TenantMigrationLoader` calcula SHA-256 do arquivo; `PostgresTenantMigrationRepository` valida `TenantSchemaName`, substitui somente a ocorrência exata do marcador por identificador escapado, adquire advisory lock, abre transação, aplica SQL e grava `{ version, checksum, appliedAt }` em `"<tenant>"."_gado_tenant_migrations"`.

Não existe rewrite de queries normais nem substituição de valores SQL.

- [x] **Step 5: Implementar UseCase idempotente**

```typescript
export interface TenantMigrationRepository {
  appliedVersions(schemaName: TenantSchemaName): Promise<Map<string, string>>;
  apply(schemaName: TenantSchemaName, migration: TenantMigration): Promise<void>;
}

export class MigrateTenantSchemaUseCase {
  async execute(): Promise<{ fromVersion: string | null; toVersion: string }> {
    const { schemaName } = this.context.requireTenant();
    return this.migrations.applyPending(TenantSchemaName.parse(schemaName));
  }
}
```

O provisionamento de schema ainda sem sessão usa uma entrada `job` reidratada e validada; não recebe schema arbitrário de Controller.

- [x] **Step 6: Executar GREEN**

Run:

```powershell
npm run test:migrations
npx prisma migrate status --schema prisma/admin/schema.prisma
```

Expected: PASS em vazio, upgrade e retry; checksums iguais; status administrativo sem migration pendente no banco de teste.

- [x] **Step 7: Commit GREEN**

```powershell
git add prisma src/tenant-provisioning test/migrations prisma.config.ts
git commit -m "feat: add versioned admin and tenant migrations"
```

## 12. Task 10 — Gates de arquitetura e OpenAPI

**Files:**

- Create: `test/architecture/hexagonal-boundaries.spec.ts`
- Create: `test/contracts/openapi-completeness.e2e-spec.ts`
- Modify: controllers/DTOs novos criados nesta onda

- [x] **Step 1: Escrever teste arquitetural RED**

O teste percorre imports TypeScript e garante:

```typescript
const forbidden = {
  controller: ['@prisma/client', '@prisma/client-admin', 'aws-sdk', '/infrastructure/'],
  useCase: ['@nestjs/common', '@nestjs/swagger', '@prisma/client', '@prisma/client-admin', 'express'],
  domain: ['@nestjs/', '@prisma/', 'express', 'pg'],
};
```

Também falha se controller novo não importar um UseCase ou se um módulo acessar `/infrastructure/` de outro módulo. A quarentena só aceita nomes preexistentes do JSON da Task 1.

Run: `npm run test:architecture`

Expected RED: violações novas desta onda ou scanner ausente; não aceitar RED causado por path incorreto.

- [x] **Step 2: Escrever teste OpenAPI RED**

Gerar documento em memória e afirmar para toda operação fora da quarentena:

- `operationId` não vazio e único;
- tags e segurança coerentes com `/admin`, `/account` ou operacional;
- request DTO quando recebe body/query/params;
- response `2xx` com envelope tipado;
- responses comuns `400`, `401`, `403` e `500` quando aplicáveis;
- nenhum schema público contém chave fora de `camelCase`.

Run: `npm run test:contract -- openapi-completeness.e2e-spec.ts`

Expected RED até DTOs/decorators da onda estarem completos.

- [x] **Step 3: Commit RED**

```powershell
git add test/architecture test/contracts/openapi-completeness.e2e-spec.ts
git commit -m "test: enforce architecture and openapi boundaries"
```

- [x] **Step 4: Corrigir somente código da Onda 00**

Adicionar `@ApiTags`, `@ApiOperation`, auth, params/query/body e responses tipadas aos probes e endpoints novos. Mover qualquer dependência concreta encontrada para adapter e token de DI. Controllers antigos permanecem congelados na quarentena e não recebem features.

- [x] **Step 5: Executar GREEN e commit**

Run:

```powershell
npm run test:architecture
npm run test:contract
```

Expected: PASS; zero endpoint novo sem contrato e zero dependência invertida.

```powershell
git add src test/architecture test/contracts test/fixtures/legacy-route-quarantine.json
git commit -m "chore: enforce architecture and openapi gates"
```

## 13. Task 11 — CI e coverage da fundação

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: config Jest de coverage

- [x] **Step 1: Criar um teste de configuração que falha sem gates**

O spec carrega `.github/workflows/ci.yml` como texto e afirma presença e ordem lógica de `npm ci`, `lint:check`, `build`, `test:unit`, `test:architecture`, `test:contract`, `test:isolation`, `test:migrations` e `test:cov`.

Run: `npm run test:architecture -- ci-workflow.spec.ts`

Expected: FAIL porque o workflow não existe.

- [x] **Step 2: Commit RED**

```powershell
git add test/architecture/ci-workflow.spec.ts
git commit -m "test: specify backend continuous integration gates"
```

- [x] **Step 3: Implementar workflow**

O workflow usa PostgreSQL service descartável, configura apenas secrets de CI, instala com `npm ci`, gera os dois clients Prisma e executa os scripts em jobs que não escrevem no repositório. O job de migration precede isolation; nenhum comando usa `db push`.

Coverage da fundação inclui explicitamente `src/common/**`, `src/identity-access/**`, `src/tenant/**` e `src/tenant-provisioning/**`, com thresholds 80/80/80/80. Arquivos legados ainda não migrados não reduzem esse gate, mas a cobertura global é registrada como baseline não decrescente.

- [x] **Step 4: Executar a sequência local equivalente**

```powershell
npm run lint:check
npm run build
npm run test:unit -- --runInBand
npm run test:architecture -- --runInBand
npm run test:contract -- --runInBand
npm run test:integration -- --runInBand
npm run test:isolation -- --runInBand
npm run test:migrations -- --runInBand
npm run test:cov -- --runInBand
```

Expected: todos exit code `0`; zero skipped; coverage da fundação >= 80% em cada métrica.

- [x] **Step 5: Commit GREEN**

```powershell
git add .github package.json package-lock.json test
git commit -m "ci: gate backend foundation quality"
```

## 14. Task 12 — Remoção das duplicidades e relatório TDD

**Files:**

- Delete: arquivos antigos listados na seção 2 que ficaram sem imports
- Modify: `docs/testing/wave-00-backend-foundation.tdd.md`
- Modify: `docs/superpowers/plans/2026-09-12-gado-saas-master.md`

- [x] **Step 1: Provar ausência das implementações proibidas**

Run:

```powershell
rg "TenantContext|RequestContext|globalTenantPrismaService|getClientForSchema|executeInTenantSchema|console\.(log|warn|error)|useGlobalFilters|useGlobalPipes|useGlobalInterceptors" src
rg "BAD_REQUEST|INTERNAL_ERROR|UNKNOWN_ERROR|success: false|success: true" src
```

Expected: sem ocorrências em produção, exceto strings explicitamente usadas em testes negativos.

- [x] **Step 2: Remover arquivos mortos e repetir todos os gates**

Run: repetir a sequência completa da Task 11.

Expected: PASS idêntico após remoção.

- [x] **Step 3: Preencher o relatório de evidências**

Para cada Task 2–11, registrar:

```markdown
| Task | Garantia | RED command/result | GREEN command/result | Commits | Coverage |
|---|---|---|---|---|---|
| 2 | Contextos concorrentes não vazam tenant | comando + falha real | comando + PASS real | hashes reais | percentual real |
```

Não registrar PASS, coverage ou hash que não tenha sido observado.

- [x] **Step 4: Marcar `G0` no plano mestre**

Somente marcar a Onda 00 como concluída quando contexto, client, erros, logs, contratos, migrations, arquitetura e CI estiverem verdes. Se o spike Prisma parar a onda, registrar o bloqueio e manter `G0` aberto.

- [x] **Step 5: Commit final da onda**

```powershell
git add docs src test .github package.json package-lock.json prisma
git commit -m "docs: record wave 00 tdd evidence"
git log --oneline --decorate -15
```

Expected: sequência RED/GREEN/refactor da onda visível e alcançável a partir de `HEAD`.

## 15. Gate de saída G0

A Onda 00 termina apenas com todas as respostas abaixo iguais a “sim”:

- [x] Existe exatamente um `AsyncLocalStorage` de request/tenant?
- [x] O tenant vem de identidade verificada e registry, nunca de body/query/path/header isolado?
- [x] Banco tenant falha fechado sem contexto e passou com dois schemas concorrentes reais?
- [x] Nenhuma query é reescrita em runtime?
- [x] Toda request/response passa pelo interceptor global e gera JSON correlacionado/redacted?
- [x] Existe exatamente um filtro global e um envelope de erro `camelCase`?
- [x] Existe exatamente um pipe global com DTOs concretos?
- [x] Todo endpoint novo possui OpenAPI completo?
- [x] Admin vazio, tenant vazio e upgrade usam migrations versionadas e passam?
- [x] Testes arquiteturais impedem dependências proibidas?
- [x] Coverage da fundação alcançou 80% em todas as métricas?
- [x] O relatório contém evidência real RED e GREEN para cada mudança?

Depois de `G0`, executar a Onda 01 e preparar o plano detalhado da Onda 02 usando o estado real produzido pela fundação.
