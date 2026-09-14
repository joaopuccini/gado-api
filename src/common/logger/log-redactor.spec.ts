import { redactLogValue } from './log-redactor';

describe('redactLogValue', () => {
  it('preserves safe scalar values and serializes supported scalar types', () => {
    expect(redactLogValue(null)).toBeNull();
    expect(redactLogValue('value')).toBe('value');
    expect(redactLogValue(42)).toBe(42);
    expect(redactLogValue(true)).toBe(true);
    expect(redactLogValue(10n)).toBe('10');
    expect(redactLogValue(new Date('2026-09-14T00:00:00.000Z'))).toBe(
      '2026-09-14T00:00:00.000Z',
    );
    expect(redactLogValue(Symbol('safe'))).toBe('safe');
    expect(redactLogValue(Symbol())).toBe('symbol');
    expect(redactLogValue(undefined)).toBeUndefined();
    expect(redactLogValue(() => undefined)).toBeUndefined();
  });

  it('redacts normalized secret keys recursively and handles cycles', () => {
    const source: Record<string, unknown> = {
      safeValue: 'visible',
      client_secret: 'hidden',
      nested: [{ refreshToken: 'hidden-too', count: 2 }],
      omitted: undefined,
    };
    source.circular = source;

    expect(redactLogValue(source)).toEqual({
      safeValue: 'visible',
      nested: [{ count: 2 }],
      circular: '[circular]',
    });
  });
});
