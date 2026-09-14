import { TenantSchemaName } from './schema-name';
import { DomainError } from '../../common/errors/domain-error';

const errorCodeFrom = (value: string): string => {
  try {
    TenantSchemaName.parse(value);
    throw new Error('Expected schema parsing to fail');
  } catch (error: unknown) {
    if (error instanceof DomainError) return error.code;
    throw error;
  }
};

describe('TenantSchemaName', () => {
  it.each([
    'public',
    'gado_admin',
    'tenant-a',
    'tenant_a;drop schema public',
    'tenant_0123456789abcdef0123456789abcdeg',
  ])('rejects %s', (value) => {
    expect(errorCodeFrom(value)).toBe('invalidTenantSchemaName');
  });

  it('accepts a server-generated tenant schema', () => {
    expect(
      TenantSchemaName.parse('tenant_0123456789abcdef0123456789abcdef').value,
    ).toBe('tenant_0123456789abcdef0123456789abcdef');
  });
});
