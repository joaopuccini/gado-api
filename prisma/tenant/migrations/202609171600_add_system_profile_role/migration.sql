SET LOCAL search_path = "__tenant__";

ALTER TABLE "perfis"
  ADD COLUMN "system_role" "RoleFazenda";

CREATE UNIQUE INDEX "perfis_system_role_key"
  ON "perfis"("system_role");
