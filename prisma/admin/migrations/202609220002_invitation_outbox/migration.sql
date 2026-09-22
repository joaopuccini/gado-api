CREATE TABLE "gado_admin"."convite_outbox" (
  "id" UUID NOT NULL,
  "convite_id" UUID NOT NULL,
  "event_key" VARCHAR(160) NOT NULL,
  "recipient" VARCHAR(320) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "gado_admin"."OnboardingOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "convite_outbox_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "convite_outbox_convite_id_fkey"
    FOREIGN KEY ("convite_id") REFERENCES "gado_admin"."convites"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "convite_outbox_event_key_key"
  ON "gado_admin"."convite_outbox"("event_key");

CREATE INDEX "convite_outbox_status_created_at_idx"
  ON "gado_admin"."convite_outbox"("status", "created_at");
