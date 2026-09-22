ALTER TABLE "gado_admin"."convites"
  RENAME COLUMN "token" TO "token_hash";

ALTER TABLE "gado_admin"."convites"
  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "accepted_at" TIMESTAMPTZ(6),
  ADD COLUMN "revoked_at" TIMESTAMPTZ(6);

CREATE INDEX "convites_organizacao_email_status_idx"
  ON "gado_admin"."convites"("organizacao_id", "email", "status");
