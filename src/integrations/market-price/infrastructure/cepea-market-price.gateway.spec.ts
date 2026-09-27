import { CepeaMarketPriceGateway } from './cepea-market-price.gateway';

describe('CepeaMarketPriceGateway', () => {
  it('parses value and date from anchored payload fields', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          'window.cepea = {"produto":"Boi gordo","valor":"327,50","data":"26/09/2026"};',
        ),
    });
    const gateway = new CepeaMarketPriceGateway(fetcher);
    await expect(gateway.fetch()).resolves.toEqual({
      value: 327.5,
      observedAt: new Date('2026-09-26T00:00:00.000Z'),
    });
  });

  it.each([
    'window.cepea = {"valor":"0","data":"26/09/2026"};',
    'window.cepea = {"valor":"abc","data":"26/09/2026"};',
    'unrelated payload 327,50 26/09/2026',
  ])('rejects invalid or unanchored payload: %s', async (payload) => {
    const gateway = new CepeaMarketPriceGateway(
      jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(payload),
      }),
    );
    await expect(gateway.fetch()).rejects.toThrow('invalidCepeaPayload');
  });

  it('aborts requests at the configured timeout', async () => {
    const fetcher = jest.fn(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(new Error('aborted')),
          );
        }),
    );
    const gateway = new CepeaMarketPriceGateway(fetcher, 5);
    await expect(gateway.fetch()).rejects.toBeDefined();
    expect(fetcher.mock.calls[0]?.[1].signal.aborted).toBe(true);
  });
});
