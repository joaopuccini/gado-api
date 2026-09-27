SET LOCAL search_path = "__tenant__";

ALTER TABLE "pesagens"
  ADD COLUMN "registrado_por_id" INTEGER,
  ADD COLUMN "corrige_pesagem_id" INTEGER,
  ADD COLUMN "motivo_correcao" VARCHAR(500),
  ADD COLUMN "ativa" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "pesagens"
  ADD CONSTRAINT "pesagens_peso_valid"
    CHECK ("peso" > 0 AND "peso" <= 3000) NOT VALID,
  ADD CONSTRAINT "pesagens_correcao_auditavel"
    CHECK (
      ("corrige_pesagem_id" IS NULL AND "motivo_correcao" IS NULL)
      OR
      (
        "corrige_pesagem_id" IS NOT NULL
        AND length(btrim("motivo_correcao")) > 0
      )
    ) NOT VALID,
  ADD CONSTRAINT "pesagens_registrado_por_id_fkey"
    FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "pesagens_corrige_pesagem_id_fkey"
    FOREIGN KEY ("corrige_pesagem_id") REFERENCES "pesagens"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "pesagens_corrige_pesagem_id_key"
  ON "pesagens" ("corrige_pesagem_id");

CREATE INDEX "pesagens_fazenda_animal_ativa_data_id_idx"
  ON "pesagens" (
    "fazenda_id",
    "animal_id",
    "ativa",
    "data_pesagem",
    "id"
  );
