SET LOCAL search_path = "__tenant__";

CREATE UNIQUE INDEX "animais_fazenda_id_numero_brinco_key"
  ON "__tenant__"."animais" ("fazenda_id", "numero_brinco");
