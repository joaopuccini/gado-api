import type { MarketPriceGateway } from '../ports/market-price.gateway';
import type {
  MarketPriceCacheEntry,
  MarketPriceCacheRepository,
} from '../ports/market-price-cache.repository';

const CACHE_KEY = 'boi-gordo-cepea';
const FRESH_TTL_MS = 6 * 60 * 60 * 1000;

interface MarketPriceLogger {
  warn?(event: string, fields: Record<string, unknown>): void;
}

export class GetMarketPriceUseCase {
  constructor(
    private readonly gateway: MarketPriceGateway,
    private readonly cache: MarketPriceCacheRepository,
    private readonly logger: MarketPriceLogger,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute() {
    const cached = await this.cache.find(CACHE_KEY);
    const now = this.now();
    if (cached && now.getTime() - cached.fetchedAt.getTime() < FRESH_TTL_MS) {
      return this.response(cached, 'fresh');
    }

    try {
      const quote = await this.gateway.fetch();
      const entry: MarketPriceCacheEntry = {
        key: CACHE_KEY,
        value: quote.value,
        observedAt: quote.observedAt,
        fetchedAt: now,
      };
      await this.cache.save(entry);
      return this.response(entry, 'fresh');
    } catch {
      this.logger.warn?.('marketPriceRefreshFailed', {
        provider: 'cepea',
        outcome: 'error',
        errorCode: 'marketPriceUnavailable',
        fallback: cached ? 'stale' : 'none',
      });
      return cached ? this.response(cached, 'stale') : null;
    }
  }

  private response(entry: MarketPriceCacheEntry, freshness: 'fresh' | 'stale') {
    return {
      value: entry.value,
      observedAt: entry.observedAt.toISOString().slice(0, 10),
      fetchedAt: entry.fetchedAt.toISOString(),
      freshness,
    };
  }
}
