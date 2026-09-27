import { Injectable } from '@nestjs/common';
import type {
  MarketPriceGateway,
  MarketPriceQuote,
} from '../application/ports/market-price.gateway';

const CEPEA_URL =
  'https://www.cepea.esalq.usp.br/br/widgetproduto.js.php?id_indicador%5B%5D=2';

type FetchResponse = Pick<Response, 'ok' | 'status' | 'text'>;
type Fetcher = (
  input: string,
  init: { signal: AbortSignal; headers: Record<string, string> },
) => Promise<FetchResponse>;

const field = (payload: string, name: string): string | null => {
  const match = payload.match(
    new RegExp(`["']${name}["']\\s*:\\s*["']([^"']+)["']`, 'i'),
  );
  return match?.[1] ?? null;
};

const parseValue = (raw: string | null): number => {
  if (!raw) throw new Error('invalidCepeaPayload');
  const normalized = raw.includes(',')
    ? raw.replaceAll('.', '').replace(',', '.')
    : raw;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('invalidCepeaPayload');
  }
  return value;
};

const parseDate = (raw: string | null): Date => {
  const match = raw?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) throw new Error('invalidCepeaPayload');
  const value = new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00.000Z`);
  if (
    Number.isNaN(value.getTime()) ||
    value.toISOString().slice(0, 10) !== `${match[3]}-${match[2]}-${match[1]}`
  ) {
    throw new Error('invalidCepeaPayload');
  }
  return value;
};

@Injectable()
export class CepeaMarketPriceGateway implements MarketPriceGateway {
  constructor(
    private readonly fetcher: Fetcher = globalThis.fetch,
    private readonly timeoutMs = 2000,
  ) {}

  async fetch(): Promise<MarketPriceQuote> {
    const response = await this.fetcher(CEPEA_URL, {
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: { accept: 'application/javascript,text/plain' },
    });
    if (!response.ok) throw new Error('cepeaRequestFailed');
    const payload = await response.text();
    return {
      value: parseValue(field(payload, 'valor')),
      observedAt: parseDate(field(payload, 'data')),
    };
  }
}
