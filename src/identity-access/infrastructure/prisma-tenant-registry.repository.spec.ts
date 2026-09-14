import type { AdminPrismaService } from '../../admin/admin-prisma.service';
import { FazendaRole } from '../../common/rbac/rbac.config';
import type {
  QueryObservablePrismaClient,
  TenantPrismaClientFactoryPort,
} from '../../tenant/application/ports/tenant-prisma-client-factory.port';
import type { TenantRegistryRecord } from '../application/ports/tenant-registry.repository';
import { PrismaTenantRegistryRepository } from './prisma-tenant-registry.repository';

const activeTenant: TenantRegistryRecord = {
  tenantId: 'tenant-id',
  organizationId: 'organization-id',
  schemaName: 'tenant_0123456789abcdef0123456789abcdef',
  subdomain: 'fazenda-a',
  status: 'active',
};

describe('PrismaTenantRegistryRepository', () => {
  const findRegistry = jest.fn();
  const findAccess = jest.fn();
  const findLocalUser = jest.fn();
  const createTenantClient = jest.fn(
    () =>
      ({
        usuario: { findFirst: findLocalUser },
      }) as unknown as QueryObservablePrismaClient,
  );
  const adminPrisma = {
    tenantRegistry: { findFirst: findRegistry },
    acessoOrganizacao: { findUnique: findAccess },
  } as unknown as AdminPrismaService;
  const clientFactory: TenantPrismaClientFactoryPort = {
    create: createTenantClient,
    dispose: jest.fn().mockResolvedValue(undefined),
  };
  const repository = new PrismaTenantRegistryRepository(
    adminPrisma,
    clientFactory,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when the tenant registry does not exist', async () => {
    findRegistry.mockResolvedValue(null);

    await expect(repository.findById('missing')).resolves.toBeNull();
    expect(findRegistry).toHaveBeenCalledWith({
      where: { OR: [{ id: 'missing' }, { organizacaoId: 'missing' }] },
      include: { organizacao: true },
    });
  });

  it.each([
    ['ATIVO', 'TRIAL', 'active'],
    ['ATIVO', 'ATIVO', 'active'],
    ['BLOQUEADO', 'ATIVO', 'blocked'],
    ['ATIVO', 'SUSPENSO', 'blocked'],
    ['REMOVIDO', 'ATIVO', 'removed'],
    ['ATIVO', 'CANCELADO', 'removed'],
    ['PROVISIONANDO', 'TRIAL', 'provisioning'],
  ] as const)(
    'normalizes registry %s and organization %s to %s',
    async (registryStatus, organizationStatus, expectedStatus) => {
      findRegistry.mockResolvedValue({
        id: 'tenant-id',
        organizacaoId: 'organization-id',
        schemaName: activeTenant.schemaName,
        subdomain: 'FAZENDA-A',
        status: registryStatus,
        organizacao: { status: organizationStatus },
      });

      await expect(repository.findById('tenant-id')).resolves.toEqual({
        ...activeTenant,
        status: expectedStatus,
      });
    },
  );

  it('fails closed when organization access is absent or inactive', async () => {
    findAccess.mockResolvedValue({ status: 'PENDENTE' });

    await expect(
      repository.findMembership(activeTenant, 'global-user'),
    ).resolves.toBeNull();
    expect(createTenantClient.mock.calls).toHaveLength(0);
  });

  it('returns null when there is no active local user', async () => {
    findAccess.mockResolvedValue({ status: 'ATIVO' });
    findLocalUser.mockResolvedValue(null);

    await expect(
      repository.findMembership(activeTenant, 'global-user'),
    ).resolves.toBeNull();
    expect(createTenantClient.mock.calls).toHaveLength(1);
  });

  it('combines role, profile and active direct permissions for active farms', async () => {
    findAccess.mockResolvedValue({ status: 'ATIVO' });
    findLocalUser.mockResolvedValue({
      id: 41,
      perfil: {
        permissoes: [{ permissao: { codigo: 'profile:read' } }],
      },
      permissoes: [
        {
          ativo: true,
          permissao: { ativo: true, codigo: 'direct:read' },
        },
        {
          ativo: false,
          permissao: { ativo: true, codigo: 'ignored:user-disabled' },
        },
        {
          ativo: true,
          permissao: { ativo: false, codigo: 'ignored:permission-disabled' },
        },
      ],
      fazendas: [
        {
          fazendaId: 10,
          role: FazendaRole.COLABORADOR,
          fazenda: { ativo: true },
        },
        { fazendaId: 20, role: FazendaRole.DONO, fazenda: { ativo: false } },
      ],
    });

    await expect(
      repository.findMembership(activeTenant, 'global-user'),
    ).resolves.toEqual({
      localUserId: 41,
      farms: [
        expect.objectContaining({
          farmId: 10,
          permissions: expect.arrayContaining([
            'dashboard:ler',
            'profile:read',
            'direct:read',
          ]) as unknown,
        }),
      ],
    });
  });
});
