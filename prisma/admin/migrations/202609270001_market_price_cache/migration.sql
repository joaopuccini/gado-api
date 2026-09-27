CREATE TABLE "gado_admin"."market_price_cache" (
  "key" VARCHAR(100) NOT NULL,
  "value" DECIMAL(12,4) NOT NULL,
  "observed_at" DATE NOT NULL,
  "fetched_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "market_price_cache_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "market_price_cache_value_positive" CHECK ("value" > 0)
);
