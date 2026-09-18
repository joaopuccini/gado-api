-- Forward-only additive migration. Rollback requires a new compensating migration.

-- CreateEnum
CREATE TYPE "gado_admin"."OnboardingOutboxStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SENT',
    'FAILED'
);

-- CreateTable
CREATE TABLE "gado_admin"."onboarding_outbox" (
    "id" UUID NOT NULL,
    "provisioning_run_id" UUID NOT NULL,
    "event_key" VARCHAR(160) NOT NULL,
    "recipient" VARCHAR(320) NOT NULL,
    "template_key" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "gado_admin"."OnboardingOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(6),
    "error_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "onboarding_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_outbox_event_key_key"
ON "gado_admin"."onboarding_outbox"("event_key");

-- CreateIndex
CREATE INDEX "onboarding_outbox_status_next_attempt_at_idx"
ON "gado_admin"."onboarding_outbox"("status", "next_attempt_at");

-- AddForeignKey
ALTER TABLE "gado_admin"."onboarding_outbox"
ADD CONSTRAINT "onboarding_outbox_provisioning_run_id_fkey"
FOREIGN KEY ("provisioning_run_id") REFERENCES "gado_admin"."provisioning_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
