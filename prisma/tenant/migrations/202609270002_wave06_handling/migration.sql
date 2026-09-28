SET LOCAL search_path = "__tenant__";

CREATE TYPE "TipoEventoReprodutivo" AS ENUM (
  'COBERTURA',
  'INSEMINACAO',
  'DIAGNOSTICO_GESTACAO',
  'PARTO',
  'ENCERRAMENTO_CICLO'
);

CREATE TYPE "StatusCicloReprodutivo" AS ENUM ('ABERTO', 'PRENHE', 'ENCERRADO');
CREATE TYPE "StatusStorageFoto" AS ENUM ('PENDENTE', 'ATIVO', 'REMOCAO_PENDENTE');

ALTER TABLE "pastos"
  ADD CONSTRAINT "pastos_tamanho_hectares_positive"
    CHECK ("tamanho_hectares" IS NULL OR "tamanho_hectares" > 0) NOT VALID,
  ADD CONSTRAINT "pastos_geojson_polygon_valid"
    CHECK (
      "geojson" IS NULL
      OR (
        jsonb_typeof("geojson") = 'object'
        AND "geojson" ->> 'type' = 'Feature'
        AND "geojson" #>> '{geometry,type}' = 'Polygon'
      )
    ) NOT VALID;

ALTER TABLE "movimentos_pasto"
  ADD COLUMN "registrado_por_id" INTEGER,
  ADD CONSTRAINT "movimentos_pasto_distinct_locations"
    CHECK ("pasto_origem_id" <> "pasto_destino_id") NOT VALID,
  ADD CONSTRAINT "movimentos_pasto_registrado_por_id_fkey"
    FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "movimentos_lote"
  ADD COLUMN "registrado_por_id" INTEGER,
  ADD CONSTRAINT "movimentos_lote_distinct_locations"
    CHECK ("lote_origem_id" <> "lote_destino_id") NOT VALID,
  ADD CONSTRAINT "movimentos_lote_registrado_por_id_fkey"
    FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transferencia_animais"
  ADD CONSTRAINT "transferencia_animais_distinct_farms"
    CHECK ("fazenda_origem_id" <> "fazenda_destino_id") NOT VALID,
  ADD CONSTRAINT "transferencia_animais_pasto_destino_id_fkey"
    FOREIGN KEY ("pasto_destino_id") REFERENCES "pastos"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "transferencia_animais_lote_destino_id_fkey"
    FOREIGN KEY ("lote_destino_id") REFERENCES "lotes"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manejo_reproducao"
  ALTER COLUMN "boi_id" DROP NOT NULL,
  ADD COLUMN "registrado_por_id" INTEGER,
  ADD COLUMN "ciclo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN "tipo_evento" "TipoEventoReprodutivo" NOT NULL DEFAULT 'COBERTURA',
  ADD COLUMN "status_ciclo" "StatusCicloReprodutivo" NOT NULL DEFAULT 'ABERTO',
  ADD COLUMN "data_evento" DATE;

UPDATE "manejo_reproducao"
SET "data_evento" = "data_corre"
WHERE "data_evento" IS NULL;

ALTER TABLE "manejo_reproducao"
  ALTER COLUMN "data_evento" SET NOT NULL,
  ALTER COLUMN "data_evento" SET DEFAULT CURRENT_DATE,
  ADD CONSTRAINT "manejo_reproducao_registrado_por_id_fkey"
    FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "vacinacoes"
  ADD COLUMN "registrado_por_id" INTEGER,
  ADD COLUMN "protocolo" VARCHAR(200),
  ADD COLUMN "dose" DECIMAL(10, 3),
  ADD COLUMN "unidade_dose" VARCHAR(20),
  ADD COLUMN "proxima_dose" DATE,
  ADD COLUMN "ativa" BOOLEAN NOT NULL DEFAULT true;

UPDATE "vacinacoes"
SET "protocolo" = COALESCE(NULLIF(btrim("descricao"), ''), 'Protocolo legado')
WHERE "protocolo" IS NULL;

ALTER TABLE "vacinacoes"
  ALTER COLUMN "protocolo" SET NOT NULL,
  ADD CONSTRAINT "vacinacoes_dose_positive"
    CHECK ("dose" IS NULL OR "dose" > 0) NOT VALID,
  ADD CONSTRAINT "vacinacoes_registrado_por_id_fkey"
    FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fotos"
  ALTER COLUMN "caminho" DROP NOT NULL,
  ADD COLUMN "registrado_por_id" INTEGER,
  ADD COLUMN "object_key" VARCHAR(500),
  ADD COLUMN "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
  ADD COLUMN "tamanho_bytes" INTEGER,
  ADD COLUMN "checksum_sha256" CHAR(64),
  ADD COLUMN "status_storage" "StatusStorageFoto" NOT NULL DEFAULT 'ATIVO';

UPDATE "fotos"
SET "object_key" = "caminho"
WHERE "object_key" IS NULL;

ALTER TABLE "fotos"
  ALTER COLUMN "object_key" SET NOT NULL,
  ADD CONSTRAINT "fotos_tamanho_bytes_positive"
    CHECK ("tamanho_bytes" IS NULL OR "tamanho_bytes" > 0) NOT VALID,
  ADD CONSTRAINT "fotos_registrado_por_id_fkey"
    FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "movimentos_pasto_fazenda_animal_data_id_idx"
  ON "movimentos_pasto" ("fazenda_id", "animal_id", "data_movimento", "id");
CREATE INDEX "movimentos_lote_fazenda_animal_data_id_idx"
  ON "movimentos_lote" ("fazenda_id", "animal_id", "data_movimento", "id");
CREATE INDEX "transferencia_animais_origem_animal_data_id_idx"
  ON "transferencia_animais" ("fazenda_origem_id", "animal_id", "data_transferencia", "id");
CREATE INDEX "manejo_reproducao_fazenda_vaca_data_id_idx"
  ON "manejo_reproducao" ("fazenda_id", "vaca_id", "data_evento", "id");
CREATE INDEX "manejo_reproducao_ciclo_data_id_idx"
  ON "manejo_reproducao" ("ciclo_id", "data_evento", "id");
CREATE INDEX "vacinacoes_fazenda_animal_proxima_dose_idx"
  ON "vacinacoes" ("fazenda_id", "animal_id", "proxima_dose");
CREATE UNIQUE INDEX "fotos_object_key_key" ON "fotos" ("object_key");
CREATE INDEX "fotos_fazenda_animal_created_at_idx"
  ON "fotos" ("fazenda_id", "animal_id", "createdAt");
