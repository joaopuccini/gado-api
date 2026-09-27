import type {
  MarketPriceGateway,
  MarketPriceQuote,
} from '../ports/market-price.gateway';
import type {
  MarketPriceCacheEntry,
  MarketPriceCacheRepository,
} from '../ports/market-price-cache.repository';
import { GetMarketPriceUseCase } from './get-market-price.use-case';

class StubGateway implements MarketPriceGateway {
  calls = 0;
  result: MarketPriceQuote = {
    value: 327.5,
    observedAt: new Date('2026-09-26T00:00:00.000Z'),
  };
  error: Error | null = null;
  fetch(): Promise<MarketPriceQuote> {
    this.calls += 1;
    return this.error
      ? Promise.reject(this.error)
      : Promise.resolve(this.result);
  }
}

class StubCache implements MarketPriceCacheRepository {
  entry: MarketPriceCacheEntry | null = null;
  saves: MarketPriceCacheEntry[] = [];
  find(): Promise<MarketPriceCacheEntry | null> {
    return Promise.resolve(this.entry);
  }
  save(entry: MarketPriceCacheEntry): Promise<void> {
    this.entry = entry;
    this.saves.push(entry);
    return Promise.resolve();
  }
}

const cached = (fetchedAt: string): MarketPriceCacheEntry => ({
  key: 'boi-gordo-cepea',
  value: 320.25,
  observedAt: new Date('2026-09-25T00:00:00.000Z'),
  fetchedAt: new Date(fetchedAt),
});

describe('GetMarketPriceUseCase', () => {
  const now = () => new Date('2026-09-27T12:00:00.000Z');

  it('returns a fresh cache hit without calling CEPEA', async () => {
    const gateway = new StubGateway();
    const cache = new StubCache();
    cache.entry = cached('2026-09-27T08:00:00.000Z');
    const useCase = new GetMarketPriceUseCase(gateway, cache, {}, now);

    await expect(useCase.execute()).resolves.toMatchObject({
      value: 320.25,
      freshness: 'fresh',
    });
    expect(gateway.calls).toBe(0);
  });

  it('refreshes an expired cache and persists the valid quote', async () => {
    const gateway = new StubGateway();
    const cache = new StubCache();
    cache.entry = cached('2026-09-27T05:59:59.999Z');
    const useCase = new GetMarketPriceUseCase(gateway, cache, {}, now);

    await expect(useCase.execute()).resolves.toEqual({
      value: 327.5,
      observedAt: '2026-09-26',
      fetchedAt: '2026-09-27T12:00:00.000Z',
      freshness: 'fresh',
    });
    expect(cache.saves).toEqual([
      {
        key: 'boi-gordo-cepea',
        value: 327.5,
        observedAt: new Date('2026-09-26T00:00:00.000Z'),
        fetchedAt: new Date('2026-09-27T12:00:00.000Z'),
      },
    ]);
  });

  it('falls back to stale cache when CEPEA fails', async () => {
    const gateway = new StubGateway();
    gateway.error = new Error('secret response body https://provider.test?q=x');
    const cache = new StubCache();
    cache.entry = cached('2026-09-26T00:00:00.000Z');
    const logger = { warn: jest.fn() };
    const useCase = new GetMarketPriceUseCase(gateway, cache, logger, now);

    await expect(useCase.execute()).resolves.toMatchObject({
      value: 320.25,
      freshness: 'stale',
    });
    expect(logger.warn).toHaveBeenCalledWith('marketPriceRefreshFailed', {
      provider: 'cepea',
      outcome: 'error',
      errorCode: 'marketPriceUnavailable',
      fallback: 'stale',
    });
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('secret');
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(
      'provider.test',
    );
  });

  it('returns null without failing the dashboard when no fallback exists', async () => {
    const gateway = new StubGateway();
    gateway.error = new Error('offline');
    const logger = { warn: jest.fn() };
    const useCase = new GetMarketPriceUseCase(
      gateway,
      new StubCache(),
      logger,
      now,
    );
    await expect(useCase.execute()).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      'marketPriceRefreshFailed',
      expect.objectContaining({ fallback: 'none' }),
    );
  });
});
