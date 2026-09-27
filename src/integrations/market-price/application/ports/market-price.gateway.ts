export interface MarketPriceQuote {
  readonly value: number;
  readonly observedAt: Date;
}

export interface MarketPriceGateway {
  fetch(): Promise<MarketPriceQuote>;
}

export const MARKET_PRICE_GATEWAY = Symbol('MARKET_PRICE_GATEWAY');
