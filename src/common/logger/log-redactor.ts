const sensitiveKeys = new Set([
  'authorization',
  'cookie',
  'password',
  'token',
  'secret',
  'clientsecret',
  'refreshtoken',
]);

const normalizedKey = (key: string): string =>
  key.replace(/[^a-z0-9]/gi, '').toLowerCase();

export const redactLogValue = (
  value: unknown,
  seen = new WeakSet<object>(),
): unknown => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'undefined' || typeof value === 'function') {
    return undefined;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'symbol') return value.description ?? 'symbol';
  if (typeof value !== 'object') return undefined;
  if (seen.has(value)) return '[circular]';

  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((entry) => redactLogValue(entry, seen));
  }

  const source = value as Record<string, unknown>;
  const redacted: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (sensitiveKeys.has(normalizedKey(key))) continue;
    const safeEntry = redactLogValue(entry, seen);
    if (safeEntry !== undefined) redacted[key] = safeEntry;
  }
  return redacted;
};
