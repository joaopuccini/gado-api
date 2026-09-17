# Wave 02 Single-Agent Continuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Execute it inline with one agent; do not dispatch subagents.

**Goal:** Complete Wave 02 from tracker item 2.3.5 through Gate G1 with an idempotent, resumable tenant-provisioning flow shared by e-mail and Google onboarding.

**Architecture:** Keep orchestration in framework-free application use cases and all Prisma, NestJS, SES, hashing, and JWT details behind ports. Tenant operations derive the schema exclusively from the validated `ExecutionContextStore`; admin state records progress and an outbox so retries never duplicate tenant resources or send e-mail before commit. The permission enum remains the catalog source of truth and default profiles reference only stable permission IDs, per ADR-0003.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest, AWS SDK for JavaScript v3 (`@aws-sdk/client-sesv2`).

---

## Execution contract

- Work only in `C:/Users/Joao Puccini/Desktop/repositorios-git/gado/gado-api` on the current branch unless the user explicitly changes scope.
- Preserve the existing uncommitted files `prisma/admin/migrations/migration_lock.toml` and `scratch_check_schema.js`. Never stage, edit, delete, or include them in a commit.
- Do not redo tracker items 2.3.1–2.3.4. Extend their public behavior compatibly.
- Run every RED test and observe the intended assertion failure before implementation. Commit that failing test immediately; then implement the minimum GREEN and commit it separately.
- Do not use `prisma db push`, `prisma migrate reset`, or any persistent/shared database. Database tests may run only when the database name matches `gado_wave00_test_[0-9a-f]{12}` and must use `test/migrations/database-test-harness.ts`.
- Do not pass raw schema names through HTTP or application method parameters. Resolve a validated `TenantSchemaName` from the current execution context at the infrastructure boundary.
- Never log passwords, tokens, authorization headers, full e-mail addresses, SES bodies, or provider credentials.
- After each completed tracker sub-item, update its row to `[x]` and write the actual short commit hash returned by `git rev-parse --short HEAD`. Commit that tracker update with the corresponding RED or GREEN change; never enter a prospective hash.
- At every stop, append a row to `docs/handoffs/progress-tracker.md` before the final commit, even if the stop is caused by a failing gate.

## Current checkpoint

- Branch: `main`
- Worktree: `C:/Users/Joao Puccini/Desktop/repositorios-git/gado/gado-api`
- Baseline commit: `5948da7 docs(tracker): record schema provisioning checkpoint`
- Latest completed implementation item: 2.3.4 at `fb9d5e4`
- First executable item: 2.3.5, permission synchronization RED
- Known global debt: Task 2.2 remains open until the full architecture gate is green; `AdminLoginUseCase` still imports NestJS/Prisma/JWT/bcrypt concerns.

## Target file map

```text
src/tenant-provisioning/
  application/
    ports/
      default-profile.repository.ts
      email.gateway.ts
      onboarding-outbox.repository.ts
      permission-catalog.repository.ts
      provisioning-run.repository.ts
      tenant-bootstrap.repository.ts
    services/
      seed-profiles.service.ts
      sync-permissions.service.ts
    use-cases/
      dispatch-onboarding-outbox.use-case.ts
      provision-tenant-orchestrator.use-case.ts
      provision-tenant.use-case.ts
      start-tenant-onboarding.use-case.ts
  infrastructure/
    persistence/prisma/
      prisma-default-profile.repository.ts
      prisma-onboarding-outbox.repository.ts
      prisma-permission-catalog.repository.ts
      prisma-provisioning-run.repository.ts
      prisma-tenant-bootstrap.repository.ts
    email/ses-email.gateway.ts
  presentation/
    dto/provisioning-status.response.ts
    dto/start-onboarding.dto.ts
    provisioning.controller.ts
test/tenant-provisioning/
  sync-permissions.spec.ts
  seed-profiles.spec.ts
  provision-tenant.spec.ts
  onboarding-outbox.spec.ts
  provisioning-retry.spec.ts
  provisioning-status.spec.ts
  provisioning-flow.integration.spec.ts
prisma/admin/migrations/20260917170000_add_onboarding_outbox/migration.sql
prisma/tenant/migrations/20260917160000_add_provisioning_idempotency/migration.sql
docs/testing/wave-02-identity-provisioning.tdd.md
docs/handoffs/2026-09-17-wave-02-complete.md
```

Existing files to update include `prisma/admin/schema.prisma`, `prisma/tenant/schema.prisma`, `src/tenant-provisioning/tenant-provisioning.module.ts`, auth composition files, OpenAPI fixtures, architecture quarantine, and `docs/handoffs/progress-tracker.md`.

## Task 1: Permission catalog synchronization — tracker 2.3.5 and 2.3.6

**Files:**

- Create: `test/tenant-provisioning/sync-permissions.spec.ts`
- Create: `src/tenant-provisioning/application/ports/permission-catalog.repository.ts`
- Create: `src/tenant-provisioning/application/services/sync-permissions.service.ts`
- Create: `src/tenant-provisioning/infrastructure/persistence/prisma/prisma-permission-catalog.repository.ts`
- Modify: `src/tenant-provisioning/tenant-provisioning.module.ts`
- Modify: `docs/handoffs/progress-tracker.md`

### 1A — RED

- [ ] Add a fake `PermissionCatalogRepository` and specify that `SyncPermissionsService.execute()` passes every `PERMISSIONS_CATALOG` entry exactly once, preserving stable `id`, `code`, `module`, and `action`.
- [ ] Add adapter integration cases proving two executions are idempotent, stale managed values are corrected, an unmanaged custom row is preserved, and a conflicting `codigo` attached to a different ID fails closed.
- [ ] Run `npm test -- --runInBand test/tenant-provisioning/sync-permissions.spec.ts`.
- [ ] Confirm failure is caused by the missing service/adapter, not test setup.
- [ ] Stage only the new test and tracker evidence: `git add test/tenant-provisioning/sync-permissions.spec.ts docs/handoffs/progress-tracker.md`.
- [ ] Commit `test(provisioning): define permission catalog sync` and record its returned hash in tracker row 2.3.5.

### 1B — GREEN

- [ ] Define this application contract without Prisma or Nest imports:

```ts
import type { PermissionDefinition } from '../../../common/rbac/permissions-catalog';

export const PERMISSION_CATALOG_REPOSITORY = Symbol('PERMISSION_CATALOG_REPOSITORY');

export interface PermissionCatalogRepository {
  sync(entries: readonly PermissionDefinition[]): Promise<void>;
}
```

- [ ] Implement `SyncPermissionsService` as a constructor-injected framework-free service that calls `repository.sync(PERMISSIONS_CATALOG)`.
- [ ] Implement the Prisma adapter using the tenant client created from `ExecutionContextStore.requireTenantIdentity().schemaName`. In one transaction, upsert each managed permission by stable numeric ID and update `codigo`, `nome`, `descricao`, `modulo`, `categoria`, and `ativo`; do not delete rows absent from the catalog.
- [ ] Register the symbol, adapter, and service in `TenantProvisioningModule`.
- [ ] Run the focused test again and expect all cases to pass.
- [ ] Run `npm run test:architecture -- --runInBand` and confirm no new boundary failure was introduced.
- [ ] Stage only Task 1 implementation, focused tests, and tracker. Commit `feat(provisioning): synchronize permission catalog` and record its hash in row 2.3.6.

## Task 2: Default profiles — tracker 2.3.7 and 2.3.8

**Files:**

- Create: `test/tenant-provisioning/seed-profiles.spec.ts`
- Create: `src/tenant-provisioning/application/ports/default-profile.repository.ts`
- Create: `src/tenant-provisioning/application/services/seed-profiles.service.ts`
- Create: `src/tenant-provisioning/infrastructure/persistence/prisma/prisma-default-profile.repository.ts`
- Create: `prisma/tenant/migrations/20260917160000_add_provisioning_idempotency/migration.sql`
- Modify: `prisma/tenant/schema.prisma`
- Modify: `src/tenant-provisioning/tenant-provisioning.module.ts`
- Modify: `docs/handoffs/progress-tracker.md`

### 2A — RED

- [ ] Specify one system profile for each `FazendaRole` and exact permission-ID sets from `DEFAULT_PROFILE_PERMISSIONS`.
- [ ] Specify rerun idempotency, repair of managed profile links, preservation of profiles whose `systemRole` is null, and rejection when a referenced permission ID does not exist.
- [ ] Add a schema contract assertion requiring nullable unique `Perfil.systemRole` mapped to `system_role`.
- [ ] Run `npm test -- --runInBand test/tenant-provisioning/seed-profiles.spec.ts` and observe the intended failures.
- [ ] Commit the RED as `test(provisioning): define default profile seeding`; record the hash in row 2.3.7.

### 2B — GREEN

- [ ] Add `systemRole RoleFazenda? @unique @map("system_role")` to `Perfil` without changing custom-profile uniqueness semantics.
- [ ] In the additive migration, add the nullable column and unique index. Do not edit an already-applied migration.
- [ ] Define a repository contract receiving a readonly map from role to permission IDs, and a framework-free `SeedProfilesService` that passes `DEFAULT_PROFILE_PERMISSIONS` unchanged.
- [ ] In the adapter, upsert managed profiles by `systemRole`. For each managed profile transaction, replace only that profile's `PerfilPermissao` rows and insert the configured stable permission IDs. Never delete or rename a custom profile.
- [ ] Run the focused test and expect green.
- [ ] Run `npm run test:migrations -- --runInBand` against a disposable harness database; expect clean-install and upgrade-path cases to pass.
- [ ] Commit `feat(provisioning): seed default profiles idempotently`; record the hash in row 2.3.8.

## Task 3: Tenant bootstrap and complete orchestration — tracker 2.3.9 and 2.3.10

**Files:**

- Create: `test/tenant-provisioning/provision-tenant.spec.ts`
- Create: `test/tenant-provisioning/provisioning-flow.integration.spec.ts`
- Create: `src/tenant-provisioning/application/ports/tenant-bootstrap.repository.ts`
- Create: `src/tenant-provisioning/application/use-cases/provision-tenant.use-case.ts`
- Create: `src/tenant-provisioning/application/use-cases/provision-tenant-orchestrator.use-case.ts`
- Create: `src/tenant-provisioning/infrastructure/persistence/prisma/prisma-tenant-bootstrap.repository.ts`
- Modify: `src/tenant-provisioning/application/use-cases/provision-schema.use-case.ts`
- Modify: `prisma/tenant/schema.prisma`
- Modify: `prisma/tenant/migrations/20260917160000_add_provisioning_idempotency/migration.sql`
- Modify: `src/tenant-provisioning/tenant-provisioning.module.ts`
- Modify: `docs/handoffs/progress-tracker.md`

### 3A — RED

- [ ] Specify owner creation keyed by `globalUserId`, principal farm creation keyed by `provisioningRunId`, owner/farm link creation, and smoke reads for all three resources.
- [ ] Specify that a repeated execution returns the same IDs and creates no duplicate row.
- [ ] Specify the orchestration order: create schema, migrate, synchronize permissions, seed profiles, bootstrap tenant, validate, activate.
- [ ] Specify that no later stage runs after a failure and that the run never becomes active before smoke validation succeeds.
- [ ] Run `npm test -- --runInBand test/tenant-provisioning/provision-tenant.spec.ts` and confirm the intended failure.
- [ ] Commit `test(provisioning): define tenant bootstrap flow`; record the hash in row 2.3.9.

### 3B — GREEN

- [ ] Add `@unique` to `Usuario.globalUserId` and nullable unique `Fazenda.provisioningRunId`, both with explicit snake_case mappings.
- [ ] In the additive migration, abort with a clear exception if existing non-null `global_user_id` values are duplicated, then create the two unique indexes.
- [ ] Implement a transaction that upserts the owner by global identity, resolves the `DONO` system profile, upserts the main farm by run ID, and upserts `UsuarioFazenda` by its compound identity. Return opaque IDs only.
- [ ] Keep `ProvisionSchemaUseCase` backward compatible, but expose separate create-schema and apply-migrations collaborators so the orchestrator can persist the state-machine boundary between them.
- [ ] Implement the orchestrator with application ports only. Wrap each tenant stage in `ExecutionContextStore.run()` using the registry-derived tenant identity; never accept a client-provided schema.
- [ ] Run the focused unit test and the integration test on a disposable database.
- [ ] Run `npm run test:isolation -- --runInBand`; expect all isolation cases to pass.
- [ ] Commit `feat(provisioning): bootstrap tenant resources`; record the hash in row 2.3.10.

## Task 4: Transactional onboarding outbox and SES — tracker 2.3.11 and 2.3.12

**Files:**

- Create: `test/tenant-provisioning/onboarding-outbox.spec.ts`
- Create: `src/tenant-provisioning/application/ports/email.gateway.ts`
- Create: `src/tenant-provisioning/application/ports/onboarding-outbox.repository.ts`
- Create: `src/tenant-provisioning/application/use-cases/dispatch-onboarding-outbox.use-case.ts`
- Create: `src/tenant-provisioning/infrastructure/persistence/prisma/prisma-onboarding-outbox.repository.ts`
- Create: `src/tenant-provisioning/infrastructure/email/ses-email.gateway.ts`
- Create: `prisma/admin/migrations/20260917170000_add_onboarding_outbox/migration.sql`
- Modify: `prisma/admin/schema.prisma`
- Modify: `src/tenant-provisioning/tenant-provisioning.module.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/handoffs/progress-tracker.md`

### 4A — RED

- [ ] Specify that activating a provisioning run and inserting exactly one outbox event share one admin transaction.
- [ ] Specify that the e-mail gateway is never called before that transaction commits.
- [ ] Specify deduplication by deterministic key `tenant-onboarding-active:{provisioningRunId}`.
- [ ] Specify claim, send, mark-sent, and failure-to-retry behavior; an e-mail failure must not revert an active tenant.
- [ ] Specify that logs and persisted error fields contain stable codes but no address, body, credential, token, or stack trace.
- [ ] Run `npm test -- --runInBand test/tenant-provisioning/onboarding-outbox.spec.ts` and observe the intended failures.
- [ ] Commit `test(provisioning): define onboarding outbox delivery`; record the hash in row 2.3.11.

### 4B — GREEN

- [ ] Add an admin `OnboardingOutbox` model with unique `eventKey`, recipient, template key, minimal JSON payload, `PENDING | PROCESSING | SENT | FAILED` status, attempts, `nextAttemptAt`, `sentAt`, sanitized `errorCode`, and timestamps.
- [ ] Add the matching additive SQL migration with an index on `(status, next_attempt_at)`.
- [ ] Install `@aws-sdk/client-sesv2` with `npm install @aws-sdk/client-sesv2`; do not import the SDK from application code.
- [ ] Implement `EmailGateway` with an application-owned message type. Implement `SesEmailGateway` with `SESv2Client` and `SendEmailCommand`, taking region and verified sender from validated configuration.
- [ ] Implement atomic claim using a short transaction and row locking or an equivalent compare-and-set update. Perform the network call outside the transaction; then mark sent or schedule retry with capped exponential backoff.
- [ ] Register adapters in the module and use structured logs containing only `requestId`, `provisioningRunId`, `outboxId`, and stable outcome/error code.
- [ ] Run the focused test and `npm run test:architecture -- --runInBand`.
- [ ] Commit `feat(provisioning): deliver onboarding through outbox`; record the hash in row 2.3.12.

## Task 5: Resumable, concurrency-safe retries — tracker 2.3.13 and 2.3.14

**Files:**

- Create: `test/tenant-provisioning/provisioning-retry.spec.ts`
- Create: `src/tenant-provisioning/application/ports/provisioning-run.repository.ts`
- Create: `src/tenant-provisioning/infrastructure/persistence/prisma/prisma-provisioning-run.repository.ts`
- Modify: `src/tenant-provisioning/application/use-cases/provision-tenant-orchestrator.use-case.ts`
- Modify: `src/tenant-provisioning/tenant-provisioning.module.ts`
- Modify: `docs/handoffs/progress-tracker.md`

### 5A — RED

- [ ] Build a table-driven test that fails once at schema creation, migrations, permission sync, profile seed, bootstrap, validation, and activation, then retries the same run.
- [ ] Assert completed stages execute once, the failed stage executes twice, later stages execute once after recovery, and the final run is active.
- [ ] Assert final counts: catalog permissions equal catalog size, five system profiles, one owner, one main farm, one owner/farm link, and one outbox event.
- [ ] Add concurrent-start coverage proving the same idempotency key resolves to one run and one tenant registry.
- [ ] Run `npm test -- --runInBand test/tenant-provisioning/provisioning-retry.spec.ts` and observe the intended failures.
- [ ] Commit `test(provisioning): define resumable retries`; record the hash in row 2.3.13.

### 5B — GREEN

- [ ] Define framework-free run-repository operations to create-or-load by idempotency key, load persisted state, begin a step, complete a step, fail a step with a sanitized code, and atomically activate with an outbox event.
- [ ] Implement those operations with `ProvisioningRun` and `ProvisioningStep`; increment attempts only when a step actually starts.
- [ ] Serialize execution per run with PostgreSQL advisory locking or a guarded conditional transition. Treat lock contention as “already processing,” not a second execution.
- [ ] Resume from the first incomplete persisted step. Never infer completion only from in-memory state.
- [ ] Run retry unit tests and the full disposable-database provisioning integration test.
- [ ] Commit `feat(provisioning): resume failed provisioning runs`; record the hash in row 2.3.14.

## Task 6: Asynchronous API and shared e-mail/Google path — tracker 2.3.15 and 2.3.16

**Files:**

- Create: `test/tenant-provisioning/provisioning-status.spec.ts`
- Create: `src/tenant-provisioning/application/use-cases/start-tenant-onboarding.use-case.ts`
- Create: `src/tenant-provisioning/presentation/dto/start-onboarding.dto.ts`
- Create: `src/tenant-provisioning/presentation/dto/provisioning-status.response.ts`
- Create: `src/tenant-provisioning/presentation/provisioning.controller.ts`
- Modify: `src/auth/auth.controller.ts`
- Modify: `src/auth/auth.module.ts`
- Modify: `src/tenant-provisioning/tenant-provisioning.module.ts`
- Modify: `test/fixtures/legacy-route-quarantine.json`
- Modify: OpenAPI contract fixtures under `test/contracts/`
- Modify: `docs/handoffs/progress-tracker.md`

### 6A — RED

- [ ] Specify `POST /auth/register` returns HTTP 202 with typed envelope data containing `provisioningRunId`, public state, and status URL.
- [ ] Specify the Google callback invokes the same `StartTenantOnboardingUseCase` and yields the same final tenant graph as e-mail onboarding.
- [ ] Specify `GET /auth/provisioning/:runId` returns only public states and is accessible only to the initiating identity through a short-lived, purpose-bound provisional credential.
- [ ] Specify no normal tenant access token is emitted while registry or run state is not active; after activation, normal login succeeds.
- [ ] Specify error envelopes, operation IDs, tags, request DTO validation, response DTOs, and security metadata required by the OpenAPI gate.
- [ ] Run `npm test -- --runInBand test/tenant-provisioning/provisioning-status.spec.ts` and observe intended assertion failures.
- [ ] Commit `test(provisioning): define asynchronous onboarding API`; record the hash in row 2.3.15.

### 6B — GREEN

- [ ] Implement the start use case to normalize provider identity, create-or-load the global user and provisioning run by an idempotency key, enqueue execution, and return immediately. Password hashing and provider verification stay behind infrastructure ports.
- [ ] Make both e-mail and Google controller paths call that use case; remove direct calls to `SocialProvisioningService`.
- [ ] Implement the status query with ownership enforcement and a stable public-state mapping; never expose schema names, raw SQL errors, stack traces, or internal retry details.
- [ ] Keep controller methods thin and use the standard success/error envelope and request correlation ID.
- [ ] Remove routes from legacy quarantine only after their architecture and OpenAPI tests pass. Delete `SocialProvisioningService` only when `rg "SocialProvisioningService" src test` finds no callers.
- [ ] Run the focused test, `npm run test:contract -- --runInBand`, and the shared-flow integration test.
- [ ] Commit `feat(provisioning): expose asynchronous onboarding status`; record the hash in row 2.3.16.

## Task 7: Close architecture debt and Gate G1

**Files:**

- Create or modify auth application ports for admin identity lookup, password verification, and token issuance.
- Modify: `src/auth/application/use-cases/admin-login.use-case.ts`
- Modify: auth infrastructure adapters and module wiring.
- Modify: `docs/testing/wave-02-identity-provisioning.tdd.md`
- Create: `docs/handoffs/2026-09-17-wave-02-complete.md`
- Modify: `docs/handoffs/progress-tracker.md`

### 7A — Remove the known boundary violation

- [ ] Add a focused characterization test for current admin-login success and rejection behavior before refactoring.
- [ ] Commit that failing/characterizing test separately if it exposes missing required behavior.
- [ ] Replace direct NestJS, Prisma, `JwtService`, and bcrypt imports in `AdminLoginUseCase` with application ports and domain errors; implement adapters in infrastructure.
- [ ] Run `npm run test:architecture -- --runInBand` and require zero failures.
- [ ] Only now mark the Task 2.2 parent complete if every 2.2 acceptance condition and its recorded gates are green; cite actual evidence and commit hash.

### 7B — Coverage and complete gate suite

- [ ] Run `npm run lint`; expect exit 0.
- [ ] Run `npm run build`; expect exit 0.
- [ ] Run `npm test -- --runInBand`; expect exit 0 with no skipped mandatory suite.
- [ ] Run `npm run test:architecture -- --runInBand`; expect exit 0.
- [ ] Run `npm run test:contract -- --runInBand`; expect exit 0.
- [ ] Run `npm run test:integration -- --runInBand`; expect exit 0 against a disposable database only.
- [ ] Run `npm run test:migrations -- --runInBand`; expect clean-install and upgrade paths to pass against disposable databases only.
- [ ] Run `npm run test:isolation -- --runInBand`; expect exit 0.
- [ ] Run `npm run test:cov -- --runInBand`; require statements, branches, functions, and lines all at least 80% for the Wave 02 change scope.
- [ ] Run `npm run test:no-skipped`; expect exit 0.
- [ ] If the disposable test URL is absent or fails the harness name allowlist, stop without substituting another database and record the blocker in the session row.

### 7C — Evidence, tracker, and handoff

- [ ] In `docs/testing/wave-02-identity-provisioning.tdd.md`, record each RED command/failure, GREEN command/result, migration safety evidence, final gates, coverage metrics, and associated hashes.
- [ ] Scan for unfinished implementation markers with `rg -n "TODO|FIXME|HACK|NotImplemented|throw new Error" src test prisma` and resolve every new occurrence; document intentional legacy occurrences.
- [ ] Run `rg -n "any|@ts-ignore|@ts-expect-error" src/tenant-provisioning src/auth/application` and remove every newly introduced unsafe escape.
- [ ] Verify type consistency with `npx tsc --noEmit` and ensure application ports do not expose Prisma, NestJS, AWS SDK, Express, or raw schema-name types.
- [ ] Verify `git diff --check` is clean.
- [ ] Verify `git status --short` contains only the intended Wave 02 files plus the two preserved preexisting dirty files.
- [ ] Mark Task 2.3 complete and each Gate G1 criterion `[x]` only after its corresponding gate evidence exists.
- [ ] Create the Wave 02 handoff with final state, commands/results, migrations, operational notes, known debt, and exact next tracker task.
- [ ] Append the closing row to the tracker Sessions table.
- [ ] Commit `docs(wave-02): record identity gate completion` and write its actual hash into the Task 2.3/Gate evidence.

## Per-pair commit protocol

Run these as separate commands after each RED or GREEN checkpoint; adjust the explicit `git add` file list to that checkpoint only:

```powershell
git status --short
git diff --check
git add test/tenant-provisioning/sync-permissions.spec.ts docs/handoffs/progress-tracker.md
git diff --cached --stat
git commit -m "test(provisioning): define permission catalog sync"
git rev-parse --short HEAD
```

Use the printed hash to update the tracker in the same checkpoint workflow. If recording the hash requires a follow-up documentation commit, record both hashes comma-separated, matching the established tracker convention. Never stage with `git add .` or `git add -A` because the worktree contains unrelated user changes.

## Stop conditions

Stop implementation, preserve evidence, and append a session row when any of these occurs:

- the only available database is not disposable or does not pass the harness allowlist;
- an additive migration would require destructive data repair not specified here;
- a required provider credential is unavailable for a live SES call (use the adapter fake for automated tests, and record live verification as an operational follow-up);
- repository state changes underneath the task or overlaps the preserved dirty files;
- a gate fails for an unrelated preexisting issue after the focused change is green.

This plan is already assigned to the inline, single-agent execution mode requested by the user. Start with Task 1A and proceed serially; do not begin the next RED/GREEN pair until the current pair and tracker evidence are committed.
