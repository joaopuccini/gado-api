-- Index optimized for farm-scoped ear-tag lookups.
CREATE INDEX IF NOT EXISTS "animais_fazenda_id_numero_brinco_idx"
ON "__tenant__"."animais" ("fazenda_id", "numero_brinco");
