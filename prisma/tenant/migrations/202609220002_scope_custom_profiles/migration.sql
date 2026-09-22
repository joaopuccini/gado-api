SET LOCAL search_path = "__tenant__";

DROP INDEX IF EXISTS "__tenant__"."perfis_nome_key";

ALTER TABLE "__tenant__"."perfis"
  ADD COLUMN "fazenda_id" INTEGER;

ALTER TABLE "__tenant__"."usuarios"
  ALTER COLUMN "senha_hash" DROP NOT NULL;

ALTER TABLE "__tenant__"."perfis"
  ADD CONSTRAINT "perfis_fazenda_id_fkey"
  FOREIGN KEY ("fazenda_id") REFERENCES "__tenant__"."fazendas"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "perfis_fazenda_id_nome_key"
  ON "__tenant__"."perfis"("fazenda_id", "nome");
