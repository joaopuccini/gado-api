import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { ResolveTenantContextUseCase } from '../../identity-access/application/use-cases/resolve-tenant-context.use-case';
import { JwtStrategy, type JwtPayload } from './jwt.strategy';

const request = (path = '/api/v1/animals'): Request =>
  ({
    path,
    url: path,
    hostname: 'fazenda-a.gado.com.br',
    headers: {},
  }) as Request;

const tenantPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'global-user-id',
  email: 'owner@example.com',
  nome: 'Owner',
  aud: 'gado-tenant',
  tenantId: 'tenant-id',
  organizationId: 'organization-id',
  schemaName: 'tenant_claimed',
  usuarioLocalId: 41,
  fazendaId: 7,
  role: 'DONO',
  permissoes: ['untrusted:claim'],
  ...overrides,
});

describe('JwtStrategy verified tenant claims', () => {
  const resolveTenantContext = {
    execute: jest.fn(),
  };
  const config = new ConfigService({
    JWT_SECRET: 'test-secret',
    TENANT_BASE_DOMAIN: 'gado.com.br',
  });
  const strategy = new JwtStrategy(
    config,
    resolveTenantContext as unknown as ResolveTenantContextUseCase,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    resolveTenantContext.execute.mockResolvedValue({
      globalUserId: 'global-user-id',
      tenantId: 'tenant-id',
      organizationId: 'organization-id',
      schemaName: 'tenant_verified',
      localUserId: 41,
      farmId: 7,
      accessibleFarmIds: [7, 9],
      permissions: ['animais:ler'],
    });
  });

  it('accepts only the tenant audience and verifies organization before context', async () => {
    await expect(
      strategy.validate(request(), tenantPayload()),
    ).resolves.toMatchObject({
      tenantId: 'tenant-id',
      organizationId: 'organization-id',
      fazendaId: 7,
      permissoes: ['animais:ler'],
    });
    expect(resolveTenantContext.execute).toHaveBeenCalledWith({
      verifiedSubject: 'global-user-id',
      verifiedOrganizationId: 'organization-id',
      tenantId: 'tenant-id',
      requestedFarmId: 7,
      requestedSchemaName: 'tenant_claimed',
      hostTenant: 'fazenda-a',
    });
  });

  it.each(['gado-app', 'gado-admin', undefined])(
    'rejects %s audience on a tenant route',
    async (audience) => {
      await expect(
        strategy.validate(request(), tenantPayload({ aud: audience })),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(resolveTenantContext.execute).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['subject', { sub: '' }],
    ['tenant', { tenantId: '' }],
    ['organization', { organizationId: '' }],
    ['farm', { fazendaId: Number.NaN }],
  ] as const)(
    'rejects an invalid %s claim before context',
    async (_name, claims) => {
      await expect(
        strategy.validate(request(), tenantPayload(claims)),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(resolveTenantContext.execute).not.toHaveBeenCalled();
    },
  );

  it('keeps an admin token outside tenant context resolution', async () => {
    await expect(
      strategy.validate(
        request('/api/v1/admin/dashboard'),
        tenantPayload({
          aud: 'gado-admin',
          tenantId: '',
          organizationId: '',
          fazendaId: Number.NaN,
        }),
      ),
    ).resolves.toMatchObject({
      sub: 'global-user-id',
      email: 'owner@example.com',
      role: 'DONO',
    });
    expect(resolveTenantContext.execute).not.toHaveBeenCalled();
  });
});
