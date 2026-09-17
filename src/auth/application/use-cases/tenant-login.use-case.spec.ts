import { TenantLoginUseCase } from './tenant-login.use-case';

describe('TenantLoginUseCase', () => {
  const identityRepository = {
    findActiveByEmail: jest.fn(),
  };
  const accessRepository = {
    listActiveByGlobalUser: jest.fn(),
  };
  const passwordVerifier = {
    compare: jest.fn(),
  };
  const tokenIssuer = {
    sign: jest.fn(),
  };

  const globalUser = {
    id: 'global-user-id',
    email: 'owner@example.com',
    name: 'Owner',
    passwordHash: 'stored-hash',
  };
  const operationalAccess = {
    organizationId: 'organization-id',
    tenantId: 'tenant-id',
    schemaName: 'tenant_0123456789abcdef0123456789abcdef',
    localUserId: 41,
    farmId: 7,
    farmName: 'Fazenda Principal',
    accessibleFarmIds: [7, 9],
    role: 'DONO',
    permissions: ['animais:ler', 'configuracoes:gerenciar'],
  };

  let useCase: TenantLoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new TenantLoginUseCase(
      identityRepository,
      accessRepository,
      passwordVerifier,
      tokenIssuer,
    );
  });

  it('normalizes the email and fails closed for an unknown identity', async () => {
    identityRepository.findActiveByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: ' OWNER@EXAMPLE.COM ', password: 'secret' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(identityRepository.findActiveByEmail).toHaveBeenCalledWith(
      'owner@example.com',
    );
    expect(accessRepository.listActiveByGlobalUser).not.toHaveBeenCalled();
    expect(tokenIssuer.sign).not.toHaveBeenCalled();
  });

  it('rejects password login for an identity without a password hash', async () => {
    identityRepository.findActiveByEmail.mockResolvedValue({
      ...globalUser,
      passwordHash: null,
    });

    await expect(
      useCase.execute({ email: globalUser.email, password: 'secret' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(passwordVerifier.compare).not.toHaveBeenCalled();
    expect(tokenIssuer.sign).not.toHaveBeenCalled();
  });

  it('rejects an invalid password without resolving tenant access', async () => {
    identityRepository.findActiveByEmail.mockResolvedValue(globalUser);
    passwordVerifier.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: globalUser.email, password: 'wrong' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(accessRepository.listActiveByGlobalUser).not.toHaveBeenCalled();
    expect(tokenIssuer.sign).not.toHaveBeenCalled();
  });

  it('rejects a valid identity without active operational access', async () => {
    identityRepository.findActiveByEmail.mockResolvedValue(globalUser);
    passwordVerifier.compare.mockResolvedValue(true);
    accessRepository.listActiveByGlobalUser.mockResolvedValue([]);

    await expect(
      useCase.execute({ email: globalUser.email, password: 'secret' }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(tokenIssuer.sign).not.toHaveBeenCalled();
  });

  it('issues a tenant-audience token from verified operational access', async () => {
    identityRepository.findActiveByEmail.mockResolvedValue(globalUser);
    passwordVerifier.compare.mockResolvedValue(true);
    accessRepository.listActiveByGlobalUser.mockResolvedValue([
      operationalAccess,
    ]);
    tokenIssuer.sign.mockResolvedValue({
      accessToken: 'tenant-token',
      expiresIn: 3600,
    });

    await expect(
      useCase.execute({
        email: globalUser.email,
        password: 'secret',
        farmId: operationalAccess.farmId,
      }),
    ).resolves.toEqual({ accessToken: 'tenant-token', expiresIn: 3600 });
    expect(tokenIssuer.sign).toHaveBeenCalledWith({
      aud: 'gado-tenant',
      sub: globalUser.id,
      email: globalUser.email,
      organizationId: operationalAccess.organizationId,
      tenantId: operationalAccess.tenantId,
      schemaName: operationalAccess.schemaName,
      localUserId: operationalAccess.localUserId,
      farmId: operationalAccess.farmId,
      accessibleFarmIds: operationalAccess.accessibleFarmIds,
      role: operationalAccess.role,
      permissions: operationalAccess.permissions,
    });
  });

  it('returns allowed farms without issuing a token when selection is required', async () => {
    identityRepository.findActiveByEmail.mockResolvedValue(globalUser);
    passwordVerifier.compare.mockResolvedValue(true);
    accessRepository.listActiveByGlobalUser.mockResolvedValue([
      operationalAccess,
      {
        ...operationalAccess,
        organizationId: 'second-organization-id',
        farmId: 9,
        farmName: 'Fazenda Filial',
      },
    ]);

    await expect(
      useCase.execute({ email: globalUser.email, password: 'secret' }),
    ).resolves.toEqual({
      requiresFarmSelection: true,
      farms: [
        {
          id: 7,
          name: 'Fazenda Principal',
          organizationId: 'organization-id',
        },
        {
          id: 9,
          name: 'Fazenda Filial',
          organizationId: 'second-organization-id',
        },
      ],
    });
    expect(tokenIssuer.sign).not.toHaveBeenCalled();
  });

  it('fails closed when the requested farm is outside active access', async () => {
    identityRepository.findActiveByEmail.mockResolvedValue(globalUser);
    passwordVerifier.compare.mockResolvedValue(true);
    accessRepository.listActiveByGlobalUser.mockResolvedValue([
      operationalAccess,
    ]);

    await expect(
      useCase.execute({
        email: globalUser.email,
        password: 'secret',
        farmId: 999,
      }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
    expect(tokenIssuer.sign).not.toHaveBeenCalled();
  });
});
