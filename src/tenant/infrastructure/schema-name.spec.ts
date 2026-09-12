import { TenantSchemaName } from './schema-name';

describe('TenantSchemaName', () => {
  it.each([
    'public',
    'gado_admin',
    'tenant-a',
    'tenant_a;drop schema public',
    'tenant_0123456789abcdef0123456789abcdeg',
  ])('rejects %s', (value) => {
    expect(() => TenantSchemaName.parse(value)).toThrow(
      expect.objectContaining({ code: 'invalidTenantSchemaName' }),
    );
  });

  it('accepts a server-generated tenant schema', () => {
    expect(
      TenantSchemaName.parse(
        'tenant_0123456789abcdef0123456789abcdef',
      ).value,
    ).toBe('tenant_0123456789abcdef0123456789abcdef');
  });
});
