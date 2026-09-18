SET LOCAL search_path = "__tenant__";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "usuarios"
    WHERE "global_user_id" IS NOT NULL
    GROUP BY "global_user_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'duplicate global_user_id prevents tenant bootstrap idempotency';
  END IF;
END $$;

CREATE UNIQUE INDEX "usuarios_global_user_id_key"
  ON "usuarios"("global_user_id");

ALTER TABLE "fazendas"
  ADD COLUMN "provisioning_run_id" UUID;

CREATE UNIQUE INDEX "fazendas_provisioning_run_id_key"
  ON "fazendas"("provisioning_run_id");
