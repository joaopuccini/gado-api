SET LOCAL search_path = "__tenant__";

CREATE INDEX "fazendas_parent_id_ativo_idx"
ON "__tenant__"."fazendas" ("parent_id", "ativo");

CREATE INDEX "usuario_fazenda_usuario_id_ativo_fazenda_id_idx"
ON "__tenant__"."usuario_fazenda" ("usuario_id", "ativo", "fazenda_id");

ALTER TABLE "__tenant__"."fazendas"
ADD CONSTRAINT "fazendas_parent_not_self"
CHECK ("parent_id" IS NULL OR "parent_id" <> "id");
