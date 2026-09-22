# Wave 03 — Account, Farms, Team, and Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow an organization owner to manage farms, hierarchy, team, custom profiles, and subscription limits entirely in `gado-app`, while keeping tenant data and `gado-admin` strictly isolated.

**Architecture:** Replace the legacy `fazendas` service with NestJS modules that follow `Controller -> UseCase -> Port -> Prisma Adapter`; tenant repositories obtain their client only from `ExecutionContextStore`, while organization, invitation, plan, and subscription reads use explicit admin-database ports keyed by the verified `organizationId`. Deliver the public contract through concrete DTOs and generated OpenAPI types, then build behavior-tested React pages over the shared API client.

**Tech Stack:** NestJS 11, TypeScript 5.7, Prisma ORM 7/PostgreSQL, Jest/Supertest, React 19, React Router 7, Vite, Testing Library, OpenAPI-generated TypeScript contracts.

---

## Scope and locked decisions

- Work in `gado-api` and `gado-web` on matching `feat/wave-03-account` branches; never implement on `main`.
- Preserve distinct RED and GREEN commits. A RED commit contains only a failing executable specification and necessary test fixtures; its paired GREEN commit contains the minimum production code.
- The current `src/fazendas/*` files are migration inputs, not an architecture to extend. Delete them only after the replacement routes are contract- and integration-green.
- Use verified `ExecutionContextStore.organizationId`, `schemaName`, `localUserId`, `farmId`, `accessibleFarmIds`, and `permissions`; never accept tenant identity from body/query/path.
- `Fazenda`, `Usuario`, `UsuarioFazenda`, `Perfil`, and `PerfilPermissao` remain in the tenant schema. `Organizacao`, `Convite`, `Plano`, and `Assinatura` remain in `gado_admin`.
- A farm hierarchy is one level for this wave: a root may have children, a child cannot be a parent, and cycles are rejected. This matches the matrix/branch product requirement without introducing an unrequested arbitrary tree.
- Deactivation is soft (`ativo = false`) and must reject deactivation of the currently selected farm or a root with active children.
- Invitation tokens are stored as hashes, single-use, expiring, and revocable. Plain tokens exist only in the command result used to enqueue delivery.
- Plan-limit checks occur in the same use-case transaction as the tenant write. Because admin and tenant schemas use separate clients, re-check immediately before the write and return stable domain errors; do not claim cross-database atomicity.
- Prisma changes use versioned SQL migrations and the existing migration loader. Do not run `db push`, `migrate reset`, or any command against a non-disposable database.
- Current documentation consulted through Context7 confirms concrete `class-validator` DTOs remain required at runtime, Nest provider tokens may be symbols, and Prisma compound uniques are queryable as named compound keys. Follow the repository's existing global `APP_PIPE`, `APP_FILTER`, and interceptors.

## File map

### Backend (`gado-api`)

- `src/account/farms/domain/farm.ts` — domain types and hierarchy invariants.
- `src/account/farms/application/ports/farm.repository.ts` — tenant persistence contract and `FARM_REPOSITORY` token.
- `src/account/farms/application/use-cases/create-farm.use-case.ts`, `update-farm.use-case.ts`, `list-farms.use-case.ts`, `select-farm.use-case.ts`, and `deactivate-farm.use-case.ts` — farm actions.
- `src/account/farms/infrastructure/prisma-farm.repository.ts` — Prisma tenant adapter obtained from the execution context.
- `src/account/farms/presentation/dto/create-farm.dto.ts`, `update-farm.dto.ts`, `farm.response.ts`, and `src/account/farms/presentation/farms.controller.ts` — validated HTTP/OpenAPI contract under `/api/v1/account/farms`.
- `src/account/farms/farms.module.ts` — local composition root.
- `src/account/team/*` — invitation, membership, profile, and role use cases with separate admin/tenant ports.
- `src/account/subscription/*` — read-only account/subscription summary and plan-limit policy.
- `src/account/account.module.ts` — Wave 03 composition root imported by `src/app.module.ts`.
- `prisma/admin/schema.prisma` and a new immutable admin migration — invitation hash/status lifecycle indexes.
- `prisma/tenant/schema.prisma` and a new immutable tenant migration — farm hierarchy constraints/indexes and custom-profile uniqueness.
- `test/contract/account-openapi.contract-spec.ts` — route/envelope/camelCase/operationId coverage.
- `test/isolation/account-isolation.e2e-spec.ts` — two tenants, two farms, concurrent allow/deny coverage.
- `test/integration/account-workflows.integration-spec.ts` — disposable-database vertical flows.

### Frontend (`gado-web`)

- `packages/api-client/src/account-client.ts` — the only network adapter for account endpoints.
- `packages/api-client/src/account-client.spec.ts` — envelope/error/audience behavior.
- `apps/gado-app/src/features/account/account-gateway.ts` — generated-contract-to-view-model adapter.
- `apps/gado-app/src/features/account/pages/{organization,farms,team,subscription}-page.tsx` — self-service pages.
- `apps/gado-app/src/features/account/**/*.spec.tsx` — user-visible loading, success, validation, deny, and error behaviors.
- `apps/gado-app/src/app/app-router.tsx` and `apps/gado-app/src/layouts/operational-layout.tsx` — customer-only routes/navigation.
- `apps/gado-admin/src/app/admin-router.spec.tsx` and `test/e2e/admin-isolation.e2e.spec.ts` — absence of owner routes, links, bundle markers, and accepted audience.
- `packages/contracts/openapi/gado-api.json` and `packages/contracts/src/generated/gado-api.ts` — regenerated, deterministic contract.

## Required commit protocol for every pair

1. Run the focused test and capture the expected failure.
2. Commit only the failing specification: `test(wave-03): RED <behavior>`.
3. Implement the smallest passing behavior.
4. Run the same focused test and adjacent regression suite.
5. Commit production code: `feat(wave-03): GREEN <behavior>`.
6. Record both hashes in `docs/handoffs/progress-tracker.md`; do not mark the sub-item complete until its listed gates pass.

### Task 1: Establish the account module and farm contract (Tracker 3.1.1 RED)

**Files:**
- Create: `src/account/farms/application/ports/farm.repository.ts`
- Create: `src/account/farms/application/use-cases/manage-farms.use-case.spec.ts`
- Create: `src/account/farms/presentation/dto/create-farm.dto.ts`
- Create: `src/account/farms/presentation/dto/update-farm.dto.ts`
- Create: `src/account/farms/presentation/dto/farm.response.ts`
- Modify: `docs/handoffs/progress-tracker.md`

- [ ] **Step 1: Define the inner contract in the RED spec**

```ts
export interface FarmView {
  id: number;
  name: string;
  parentId: number | null;
  active: boolean;
}

export interface FarmRepository {
  listAccessible(farmIds: readonly number[]): Promise<readonly FarmView[]>;
  findAccessible(id: number, farmIds: readonly number[]): Promise<FarmView | null>;
  create(input: { name: string; parentId: number | null; ownerLocalUserId: number }): Promise<FarmView>;
  update(id: number, input: { name?: string; parentId?: number | null }): Promise<FarmView>;
  deactivate(id: number): Promise<FarmView>;
}

export const FARM_REPOSITORY = Symbol('FARM_REPOSITORY');
```

The spec must cover create, edit, accessible list, selecting an allowed active farm, rejection of an inaccessible/inactive farm, and soft deactivation. Instantiate use cases with fakes; do not bootstrap Nest or Prisma.

- [ ] **Step 2: Prove RED and commit it**

Run: `npm test -- --runInBand src/account/farms/application/use-cases/manage-farms.use-case.spec.ts`

Expected: FAIL because `CreateFarmUseCase`, `UpdateFarmUseCase`, `ListFarmsUseCase`, `SelectFarmUseCase`, and `DeactivateFarmUseCase` do not exist.

Commit: `test(wave-03): RED specify farm management use cases`

- [ ] **Step 3: Add concrete validated DTOs without production handlers**

`CreateFarmDto` requires `name` (trimmed string, 2–200 chars) and permits integer `parentId`; `UpdateFarmDto` makes those fields optional but rejects an empty object. `FarmResponseDto` exposes only `id`, `name`, `parentId`, and `active`, with `@ApiProperty` metadata and camelCase names.

- [ ] **Step 4: Verify the RED failure is still the missing use cases**

Run the focused command again. Expected: same intentional failure, with no TypeScript/DTO compilation error.

### Task 2: Implement farm use cases and adapter (Tracker 3.1.2 GREEN)

**Files:**
- Create: `src/account/farms/domain/farm.ts`
- Create: `src/account/farms/application/use-cases/create-farm.use-case.ts`
- Create: `src/account/farms/application/use-cases/update-farm.use-case.ts`
- Create: `src/account/farms/application/use-cases/list-farms.use-case.ts`
- Create: `src/account/farms/application/use-cases/select-farm.use-case.ts`
- Create: `src/account/farms/application/use-cases/deactivate-farm.use-case.ts`
- Create: `src/account/farms/infrastructure/prisma-farm.repository.ts`
- Create: `src/account/farms/presentation/farms.controller.ts`
- Create: `src/account/farms/farms.module.ts`
- Create: `src/account/account.module.ts`
- Modify: `src/app.module.ts`
- Delete after replacement gates pass: `src/fazendas/fazendas.controller.ts`, `src/fazendas/fazendas.service.ts`, `src/fazendas/fazendas.module.ts`

- [ ] **Step 1: Implement fail-closed use cases**

Each use case calls `ExecutionContextStore.requireTenant()`. Create uses the verified `localUserId`; list/select/update/deactivate authorize against `accessibleFarmIds`. Throw typed `DomainError`s: `farmNotFound`, `farmAccessDenied`, `farmInactive`, `farmSelectedCannotDeactivate`, and `invalidFarmHierarchy` (add them to `src/common/errors/error-catalog.ts` and `error-http.mapper.ts`).

- [ ] **Step 2: Implement the Prisma adapter**

Map `name <-> nome`, `parentId`, and `active <-> ativo` explicitly. Do not spread DTOs into Prisma. Create the farm and owner's `UsuarioFazenda` (`role: DONO`) through the same callback passed to `tenant.$transaction`; obtain the tenant client through the existing context-aware factory/service only.

- [ ] **Step 3: Publish the HTTP contract**

Expose `GET/POST /account/farms`, `PATCH /account/farms/:id`, `POST /account/farms/:id/select`, and `DELETE /account/farms/:id`. Controllers translate DTOs to commands, use `@RequirePermissions`, `@ApiTags`, `@ApiOperation`, success/error response decorators, and return domain values for the global envelope interceptor.

- [ ] **Step 4: Prove GREEN and commit**

Run: `npm test -- --runInBand src/account/farms/application/use-cases/manage-farms.use-case.spec.ts`

Expected: PASS for every CRUD/selection behavior.

Then run: `npm run test:architecture -- --runInBand && npm run build`

Expected: both exit 0.

Commit: `feat(wave-03): GREEN implement farm management`

### Task 3: Specify and implement farm hierarchy policy (Tracker 3.1.3–3.1.4)

**Files:**
- Create: `src/account/farms/domain/farm-hierarchy.policy.spec.ts`
- Create: `src/account/farms/domain/farm-hierarchy.policy.ts`
- Modify: `src/account/farms/application/ports/farm.repository.ts`
- Modify: `src/account/farms/application/use-cases/{create-farm,update-farm,select-farm}.use-case.ts`
- Modify: `src/account/farms/infrastructure/prisma-farm.repository.ts`
- Modify: `prisma/tenant/schema.prisma`
- Create: `prisma/tenant/migrations/202609220001_harden_farm_hierarchy/migration.sql`

- [ ] **Step 1: Write and commit RED hierarchy cases**

Specify: root sees itself plus active direct children only when its owner/manager membership permits them; child sees only itself; another child is not implicitly accessible; parent must exist and be active; self-parent, child-as-parent, and cycles fail.

Run: `npm test -- --runInBand src/account/farms/domain/farm-hierarchy.policy.spec.ts`

Expected: FAIL because `FarmHierarchyPolicy` is missing.

Commit: `test(wave-03): RED specify farm hierarchy policy`

- [ ] **Step 2: Implement policy before repository access**

Use a pure policy receiving the selected farm, explicit memberships, and parent/children facts. Return a frozen `readonly number[]`; never mutate request-global state or infer access merely from `parentId`.

- [ ] **Step 3: Add immutable migration**

Add indexes for `fazendas(parent_id, ativo)` and `usuario_fazenda(usuario_id, ativo, fazenda_id)`, preserve the self-FK, and add SQL constraints preventing `parent_id = id`. Do not edit older migrations.

- [ ] **Step 4: Prove GREEN and commit**

Run the focused spec and `npm run test:migrations -- --runInBand` using only `TEST_DATABASE_URL` that points to a disposable database.

Expected: policy PASS; empty-schema, upgrade, and tenant-provisioning migration tests PASS. If `TEST_DATABASE_URL` is absent, stop and leave the tracker incomplete.

Commit: `feat(wave-03): GREEN enforce farm hierarchy policy`

### Task 4: Prove concurrent tenant/farm isolation (Tracker 3.1.5–3.1.6)

**Files:**
- Create: `test/isolation/account-isolation.e2e-spec.ts`
- Modify: `src/identity-access/application/use-cases/resolve-tenant-context.use-case.ts`
- Modify: `src/identity-access/infrastructure/prisma-tenant-registry.repository.ts`

- [ ] **Step 1: Commit RED isolation specification**

Create two disposable tenant schemas, each with a root and child. Run concurrent requests and assert tenant A never observes B; root A sees only explicitly linked A children; child A sees only itself; missing context fails before a Prisma query.

Run: `npm run test:isolation -- --runInBand test/isolation/account-isolation.e2e-spec.ts`

Expected: FAIL on hierarchy expansion/deny behavior.

Commit: `test(wave-03): RED prove farm hierarchy isolation`

- [ ] **Step 2: Enrich context from verified memberships**

Make the identity repository return only active memberships from the verified schema. Resolve hierarchy explicitly in the use case and pass the frozen `accessibleFarmIds` to `ExecutionContextStore.enrichTenant`; do not add an interceptor or Prisma-extension fallback.

- [ ] **Step 3: Prove GREEN and commit**

Run the focused isolation suite twice to exercise concurrency, then all isolation tests.

Expected: 0 cross-tenant rows, all requests retain their own context, all suites PASS.

Commit: `feat(wave-03): GREEN isolate farm hierarchy access`

### Task 5: Implement invitations and plan limits (Tracker 3.2.1–3.2.4)

**Files:**
- Create: `src/account/team/application/use-cases/invitations.use-case.spec.ts`
- Create: `src/account/team/application/use-cases/{invite,accept,resend,revoke}-invitation.use-case.ts`
- Create: `src/account/team/application/ports/invitation.repository.ts`
- Create: `src/account/team/infrastructure/prisma-invitation.repository.ts`
- Create: `src/account/subscription/application/plan-limit.policy.spec.ts`
- Create: `src/account/subscription/application/plan-limit.policy.ts`
- Create: `src/account/subscription/application/ports/subscription.repository.ts`
- Modify: `prisma/admin/schema.prisma`
- Create: `prisma/admin/migrations/202609220001_secure_invitation_lifecycle/migration.sql`

- [ ] **Step 1: Commit RED invitation lifecycle**

Specify invite, accept once, reject expired, resend by revoking the previous token, revoke, duplicate pending email, and wrong-organization token. Inject `Clock`, `TokenGenerator`, `TokenHasher`, repositories, and outbox ports so tests use no real clock, randomness, email, or database.

Run the focused invitations spec; expect missing use cases. Commit: `test(wave-03): RED specify invitation lifecycle`.

- [ ] **Step 2: Commit RED plan limits**

Specify `maxUsuarios` counts active organization access and `maxFazendas` counts active tenant farms; equality rejects the next create; inactive rows do not count; absent/expired subscription fails closed.

Run the policy spec; expect missing `PlanLimitPolicy`. Commit: `test(wave-03): RED specify account plan limits`.

- [ ] **Step 3: Implement secure lifecycle and limits**

Replace `Convite.token` with `tokenHash`, add `updatedAt`, `acceptedAt`, `revokedAt`, and a compound index on organization/email/status. Store only SHA-256 (or injected equivalent) hashes, normalize email once, and enqueue invitation delivery through outbox after commit. Query subscription by verified `organizationId` and return stable `userLimitReached`, `farmLimitReached`, and `subscriptionUnavailable` errors.

- [ ] **Step 4: Prove GREEN and commit separately**

Run both focused specs plus admin migration tests. Expected: PASS.

Commits:
- `feat(wave-03): GREEN implement invitation lifecycle`
- `feat(wave-03): GREEN enforce account plan limits`

### Task 6: Implement memberships, custom profiles, and role matrix (Tracker 3.2.5–3.2.10)

**Files:**
- Create: `src/account/team/application/use-cases/profile-assignment.use-case.spec.ts`
- Create: `src/account/team/application/use-cases/custom-profile.use-case.spec.ts`
- Create: `src/account/team/application/use-cases/role-access.spec.ts`
- Create: `src/account/team/application/use-cases/{assign-member,create-profile,update-profile}.use-case.ts`
- Create: `src/account/team/application/ports/team.repository.ts`
- Create: `src/account/team/infrastructure/prisma-team.repository.ts`
- Create: `src/account/team/presentation/team.controller.ts`
- Create: `src/account/team/presentation/dto/invite-member.dto.ts`
- Create: `src/account/team/presentation/dto/accept-invitation.dto.ts`
- Create: `src/account/team/presentation/dto/assign-member.dto.ts`
- Create: `src/account/team/presentation/dto/create-profile.dto.ts`
- Create: `src/account/team/presentation/dto/update-profile.dto.ts`
- Create: `src/account/team/presentation/dto/team.response.ts`
- Modify: `prisma/tenant/schema.prisma`
- Create: `prisma/tenant/migrations/202609220002_scope_custom_profiles/migration.sql`

- [ ] **Step 1: RED profile assignment**

Specify accepted user creation/linking, idempotent `UsuarioFazenda`, removal by soft deactivation, and denial for a farm outside `accessibleFarmIds`. Commit `test(wave-03): RED specify team membership assignment`.

- [ ] **Step 2: RED custom profiles**

Specify owner-only create/update, active permission IDs from the catalog, duplicate names rejected, system profiles immutable, and no empty custom profile. Commit `test(wave-03): RED specify custom farm profiles`.

- [ ] **Step 3: RED role allow/deny matrix**

Use table-driven cases for owner, manager, operator (`COLABORADOR`), and viewer (`CONSULTOR`) across farm read/write, team management, profile management, and subscription read. Commit `test(wave-03): RED specify account role access`.

- [ ] **Step 4: Implement and migrate**

Add an explicit profile scope/name unique constraint suitable for tenant schemas, map accepted organization access to the tenant `Usuario`, and write `UsuarioFazenda` plus profile assignment in one tenant transaction. Controllers use DTO classes and permission decorators; use cases depend only on ports/context/domain errors.

- [ ] **Step 5: Prove GREEN and commit**

Run all three focused specs, architecture, migrations, and build. Expected: PASS.

Commits:
- `feat(wave-03): GREEN assign team memberships`
- `feat(wave-03): GREEN manage custom profiles`
- `feat(wave-03): GREEN enforce account role access`

### Task 7: Publish account, subscription, and OpenAPI contracts

**Files:**
- Create: `src/account/organization/application/get-organization-account.use-case.ts`
- Create: `src/account/organization/presentation/organization.controller.ts`
- Create: `src/account/subscription/application/get-subscription-summary.use-case.ts`
- Create: `src/account/subscription/presentation/subscription.controller.ts`
- Create: `test/contract/account-openapi.contract-spec.ts`
- Modify: `src/account/account.module.ts`
- Modify: `src/common/errors/error-catalog.ts`
- Modify: `src/common/errors/error-http.mapper.ts`

- [ ] **Step 1: Commit RED contract assertions**

Assert all `/api/v1/account/*` operations have `operationId`, auth, success plus common error responses, explicit envelope schemas, and camelCase fields. Assert no admin mutation is reachable through account controllers.

Run: `npm run test:contract -- --runInBand test/contract/account-openapi.contract-spec.ts`

Expected: FAIL for missing organization/subscription operations. Commit: `test(wave-03): RED specify account OpenAPI contract`.

- [ ] **Step 2: Implement read models**

Expose organization name/contact/status and subscription plan/status/dates/limits/current counts. Read admin data through ports using verified `organizationId`; never expose schema name, billing internals, password/token fields, or Prisma objects.

- [ ] **Step 3: Prove GREEN and commit**

Run contract, unit, architecture, and build gates. Expected: PASS. Commit: `feat(wave-03): GREEN publish account contracts`.

### Task 8: Generate the client and add the customer account gateway

**Files:**
- Modify: `gado-web/packages/contracts/openapi/gado-api.json`
- Modify: `gado-web/packages/contracts/src/generated/gado-api.ts`
- Create: `gado-web/packages/api-client/src/account-client.spec.ts`
- Create: `gado-web/packages/api-client/src/account-client.ts`
- Modify: `gado-web/packages/api-client/src/index.ts`
- Create: `gado-web/apps/gado-app/src/features/account/account-gateway.ts`

- [ ] **Step 1: Export and verify deterministic OpenAPI**

Generate from the green backend using the repository script/workflow, run it twice, and assert the second run has no diff. Do not hand-edit generated TypeScript.

- [ ] **Step 2: Commit RED client tests**

Specify correct methods/paths, `gadoApp` audience, success-envelope unwrapping, typed API error propagation, and camelCase view-model mapping. Commit: `test(wave-03): RED specify account API client`.

- [ ] **Step 3: Implement through the central transport**

The account client must receive the existing authenticated `ApiClient`; it must not call `fetch`, Axios, or storage directly. Keep response validation in the gateway boundary.

- [ ] **Step 4: Prove GREEN and commit**

Run: `npm test -- --runInBand packages/api-client/src/account-client.spec.ts && npm run check:contracts && npm run check:network`

Expected: PASS and no new direct network call. Commit: `feat(wave-03): GREEN add account API client`.

### Task 9: Build customer self-service pages (Tracker 3.3.1–3.3.4)

**Files:**
- Create: `gado-web/apps/gado-app/src/features/account/pages/organization-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/account/pages/farms-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/account/pages/team-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/account/pages/subscription-page.spec.tsx`
- Create: `gado-web/apps/gado-app/src/features/account/pages/organization-page.tsx`
- Create: `gado-web/apps/gado-app/src/features/account/pages/farms-page.tsx`
- Create: `gado-web/apps/gado-app/src/features/account/pages/team-page.tsx`
- Create: `gado-web/apps/gado-app/src/features/account/pages/subscription-page.tsx`
- Modify: `gado-web/apps/gado-app/src/app/app-router.tsx`
- Modify: `gado-web/apps/gado-app/src/layouts/operational-layout.tsx`

- [ ] **Step 1: RED organization/subscription pages**

Specify loading, loaded fields, unavailable/error states, and read-only subscription limits. Assert against visible text and controls, not component state. Commit `test(wave-03): RED specify account summary pages`.

- [ ] **Step 2: RED farms page**

Specify list/tree, create/edit validation, select, deactivate confirmation, plan-limit denial, and inaccessible controls by permission. Commit `test(wave-03): RED specify farm self-service page`.

- [ ] **Step 3: RED team page**

Specify invitation lifecycle, membership farms, profile assignment, custom permission selection, expiry/revocation states, and role-based disabled/absent controls. Commit `test(wave-03): RED specify team self-service page`.

- [ ] **Step 4: Implement minimal accessible pages**

Use semantic forms, labels, field errors, pending button states, focusable error summaries, and existing shared layout styles. Derive display values during render; effects only coordinate asynchronous gateway calls and cancellation. Add customer routes `/conta`, `/fazendas`, `/equipe`, and `/assinatura`.

- [ ] **Step 5: Prove GREEN and commit by vertical slice**

Run the four page specs, app router/layout specs, lint, typecheck, and `build:app`.

Commits:
- `feat(wave-03): GREEN add organization and subscription pages`
- `feat(wave-03): GREEN add farm self-service page`
- `feat(wave-03): GREEN add team self-service page`

### Task 10: Prove admin/customer separation (Tracker 3.3.5–3.3.6)

**Files:**
- Create: `gado-web/test/e2e/admin-isolation.e2e.spec.ts`
- Modify: `gado-web/apps/gado-admin/src/app/admin-router.spec.tsx`
- Modify: `gado-web/scripts/check-bundles.mjs`

- [ ] **Step 1: Commit RED separation test**

Assert an owner session has no `gado-admin` route, account link, admin bundle import/marker, or token accepted by `/api/v1/admin/*`; assert an admin session has no tenant context or account route. Commit: `test(wave-03): RED prove admin customer isolation`.

- [ ] **Step 2: Tighten route/bundle/audience boundaries**

Change only composition roots, route guards, and bundle checks needed to satisfy the spec. Do not duplicate account pages in `gado-admin`.

- [ ] **Step 3: Prove GREEN and commit**

Run E2E, router specs, `check:bundles`, `check:network`, both builds, and the backend audience isolation suite. Expected: all PASS. Commit: `feat(wave-03): GREEN isolate account and admin surfaces`.

### Task 11: Execute gate G2-account and close the wave

**Files:**
- Modify: `docs/handoffs/progress-tracker.md`
- Create: `docs/testing/wave-03-account.tdd.md`
- Create: `docs/handoffs/2026-09-22-wave-03-complete.md`

- [ ] **Step 1: Run backend gates in order**

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
npm run test:no-skipped
```

Expected: every command exits 0; changed-code and global coverage remain at least 80%; database suites use only a verified disposable `TEST_DATABASE_URL`.

- [ ] **Step 2: Run frontend gates in order**

```powershell
npm run check:contracts
npm run lint
npm run typecheck
npm run test:architecture -- --runInBand
npm run test:coverage -- --runInBand
npm run build:app
npm run build:admin
npm run check:network
npm run check:bundles
```

Expected: every command exits 0, both applications build independently, and no customer account marker appears in the admin bundle.

- [ ] **Step 3: Perform migration safety checks**

Run clean-create, upgrade-from-previous, and new-tenant provisioning tests against disposable schemas. Verify retry leaves no falsely active tenant and the same immutable tenant migration chain is used. Never use `db push` or `migrate reset`.

- [ ] **Step 4: Update evidence and commit**

Record RED/GREEN hashes and exact test counts in the tracker/TDD report. Mark G2 and Wave 03 complete only if all gates above passed; otherwise record the first failing gate and leave completion unchecked.

Commit: `docs(wave-03): record G2 account evidence`.

## Self-review

- Spec coverage: Tasks 1–4 cover farms/hierarchy/isolation; Tasks 5–6 cover invitations, limits, memberships, profiles, and roles; Tasks 7–10 cover organization/subscription contracts, customer UI, and admin separation; Task 11 covers every master-plan gate.
- Placeholder scan: clean; every planned behavior and file has an explicit destination.
- Type consistency: public API uses `farmId`/`parentId`/`active`; physical tenant columns remain `fazenda_id`/`parent_id`/`ativo`; repository adapters own the mapping.
- Baseline note: `main` was synchronized at `4a6607a`; the prior integrated backend evidence was 147/147 unit tests plus architecture/contract/build green. Setup in this planning worktree could not be revalidated because interrupted `npm ci` left an `ENOTEMPTY` dependency tree and the repair timed out; execution must start by obtaining a clean dependency install before Task 1.
