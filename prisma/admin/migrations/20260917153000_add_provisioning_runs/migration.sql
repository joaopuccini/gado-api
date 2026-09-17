-- Forward-only additive migration. Rollback requires a new compensating migration.

-- CreateEnum
CREATE TYPE "gado_admin"."ProvisioningState" AS ENUM (
    'REGISTERED',
    'PROVISIONING_SCHEMA',
    'APPLYING_MIGRATIONS',
    'SEEDING',
    'VALIDATING',
    'ACTIVE'
);

-- CreateEnum
CREATE TYPE "gado_admin"."ProvisioningStepStatus" AS ENUM (
    'PENDING',
    'RUNNING',
    'SUCCEEDED',
    'FAILED'
);

-- CreateTable
CREATE TABLE "gado_admin"."provisioning_runs" (
    "id" UUID NOT NULL,
    "tenant_registry_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "state" "gado_admin"."ProvisioningState" NOT NULL DEFAULT 'REGISTERED',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "provisioning_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gado_admin"."provisioning_steps" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "state" "gado_admin"."ProvisioningState" NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" "gado_admin"."ProvisioningStepStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_code" VARCHAR(100),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "provisioning_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provisioning_runs_idempotency_key_key"
ON "gado_admin"."provisioning_runs"("idempotency_key");

-- CreateIndex
CREATE INDEX "provisioning_runs_tenant_registry_id_state_idx"
ON "gado_admin"."provisioning_runs"("tenant_registry_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "provisioning_steps_run_id_state_attempt_key"
ON "gado_admin"."provisioning_steps"("run_id", "state", "attempt");

-- CreateIndex
CREATE INDEX "provisioning_steps_run_id_status_idx"
ON "gado_admin"."provisioning_steps"("run_id", "status");

-- AddForeignKey
ALTER TABLE "gado_admin"."provisioning_runs"
ADD CONSTRAINT "provisioning_runs_tenant_registry_id_fkey"
FOREIGN KEY ("tenant_registry_id") REFERENCES "gado_admin"."tenant_registry"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gado_admin"."provisioning_steps"
ADD CONSTRAINT "provisioning_steps_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "gado_admin"."provisioning_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
