import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ExecutionContextStore } from '../../../common/context';
import { DEFAULT_PROFILE_PERMISSIONS } from '../../../common/rbac/default-profiles';
import { FazendaRole } from '../../../common/rbac/rbac.enums';
import type {
  QueryObservablePrismaClient,
  TenantPrismaClientFactoryPort,
} from '../../../tenant/application/ports/tenant-prisma-client-factory.port';
import type { DefaultProfileRepository } from '../ports/default-profile.repository';
import { PrismaDefaultProfileRepository } from '../../infrastructure/persistence/prisma/prisma-default-profile.repository';
import { SeedProfilesService } from './seed-profiles.service';

describe('SeedProfilesService', () => {
  it('sends all five roles with their exact stable permission IDs', async () => {
    const repository: jest.Mocked<DefaultProfileRepository> = {
      seed: jest.fn().mockResolvedValue(undefined),
    };
    const service = new SeedProfilesService(repository);

    await service.execute();

    expect(repository.seed).toHaveBeenCalledTimes(1);
    expect(repository.seed).toHaveBeenCalledWith(DEFAULT_PROFILE_PERMISSIONS);
    expect(Object.keys(repository.seed.mock.calls[0][0]).sort()).toEqual(
      Object.values(FazendaRole).sort(),
    );
    expect(repository.seed.mock.calls[0][0][FazendaRole.DONO]).toEqual(
      DEFAULT_PROFILE_PERMISSIONS[FazendaRole.DONO],
    );
  });
});

describe('PrismaDefaultProfileRepository', () => {
  const schemaName = 'tenant_0123456789abcdef0123456789abcdef';
  const profileUpsert = jest.fn().mockResolvedValue({ id: 41 });
  const profileDeleteMany = jest.fn();
  const linksDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const linksCreateMany = jest.fn().mockResolvedValue({ count: 2 });
  const transactionClient = {
    perfil: { upsert: profileUpsert, deleteMany: profileDeleteMany },
    perfilPermissao: {
      deleteMany: linksDeleteMany,
      createMany: linksCreateMany,
    },
  };
  const transaction = jest.fn(
    async (callback: (client: typeof transactionClient) => Promise<void>) =>
      callback(transactionClient),
  );
  const tenantClient = {
    $transaction: transaction,
  } as unknown as QueryObservablePrismaClient;
  const clientFactory: jest.Mocked<TenantPrismaClientFactoryPort> = {
    create: jest.fn().mockReturnValue(tenantClient),
    dispose: jest.fn().mockResolvedValue(undefined),
  };
  const context = new ExecutionContextStore();
  const repository = new PrismaDefaultProfileRepository(
    context,
    clientFactory,
  );

  const runInJobContext = <T>(callback: () => T): T =>
    context.run(
      {
        requestId: 'request-id',
        traceId: 'trace-id',
        contextType: 'job',
        startedAt: 1,
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        schemaName,
        globalUserId: 'global-user-id',
        accessibleFarmIds: [],
        permissions: [],
      },
      callback,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    profileUpsert.mockResolvedValue({ id: 41 });
    linksDeleteMany.mockResolvedValue({ count: 0 });
    linksCreateMany.mockResolvedValue({ count: 2 });
  });

  it('upserts a managed profile by system role and replaces only its links', async () => {
    await runInJobContext(() =>
      repository.seed({ [FazendaRole.GESTOR]: [1, 6] }),
    );

    expect(profileUpsert).toHaveBeenCalledWith({
      where: { systemRole: FazendaRole.GESTOR },
      create: {
        nome: FazendaRole.GESTOR,
        descricao: 'Perfil-base GESTOR',
        systemRole: FazendaRole.GESTOR,
        ativo: true,
      },
      update: {
        nome: FazendaRole.GESTOR,
        descricao: 'Perfil-base GESTOR',
        ativo: true,
      },
    });
    expect(linksDeleteMany).toHaveBeenCalledWith({ where: { perfilId: 41 } });
    expect(linksCreateMany).toHaveBeenCalledWith({
      data: [
        { perfilId: 41, permissaoId: 1 },
        { perfilId: 41, permissaoId: 6 },
      ],
      skipDuplicates: true,
    });
    expect(profileDeleteMany).not.toHaveBeenCalled();
  });

  it('is idempotent and preserves custom profiles', async () => {
    await runInJobContext(() => repository.seed(DEFAULT_PROFILE_PERMISSIONS));
    await runInJobContext(() => repository.seed(DEFAULT_PROFILE_PERMISSIONS));

    expect(profileUpsert).toHaveBeenCalledTimes(Object.values(FazendaRole).length * 2);
    expect(profileDeleteMany).not.toHaveBeenCalled();
  });

  it('rolls back when a configured permission ID does not exist', async () => {
    linksCreateMany.mockRejectedValueOnce(new Error('foreign key violation'));

    await expect(
      runInJobContext(() => repository.seed({ [FazendaRole.DONO]: [999] })),
    ).rejects.toThrow('foreign key violation');
  });
});

describe('default profile schema contract', () => {
  it('identifies system profiles independently from custom profile names', () => {
    const schema = readFileSync(
      resolve(process.cwd(), 'prisma/tenant/schema.prisma'),
      'utf8',
    );

    expect(schema).toMatch(
      /model Perfil \{[\s\S]*systemRole\s+RoleFazenda\?\s+@unique\s+@map\("system_role"\)/,
    );
  });
});
