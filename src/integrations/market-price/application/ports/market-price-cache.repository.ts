export interface MarketPriceCacheEntry {
  readonly key: string;
  readonly value: number;
  readonly observedAt: Date;
  readonly fetchedAt: Date;
}

export interface MarketPriceCacheRepository {
  find(key: string): Promise<MarketPriceCacheEntry | null>;
  save(entry: MarketPriceCacheEntry): Promise<void>;
}

export const MARKET_PRICE_CACHE_REPOSITORY = Symbol(
  'MARKET_PRICE_CACHE_REPOSITORY',
);
