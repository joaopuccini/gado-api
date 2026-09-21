import type { AdminPrismaService } from '../../../../admin/admin-prisma.service';
import { PrismaTenantOnboardingRepository } from './prisma-tenant-onboarding.repository';

interface ExistingRun {
  readonly id: string;
  readonly state: string;
  readonly tenantRegistry: {
    readonly id: string;
    readonly schemaName: string;
    readonly organizacao: {
      readonly id: string;
      readonly acessos: readonly { readonly usuarioGlobalId: string }[];
    };
  };
}

interface GlobalUserUpsertInput {
  readonly where: { readonly email: string };
  readonly create: {
    readonly nome: string;
    readonly email: string;
    readonly senhaHash?: string;
    readonly googleId?: string;
    readonly authProvider: string;
  };
  readonly update: Readonly<Record<string, string>>;
}

interface OrganizationCreateInput {
  readonly data: {
    readonly razaoSocial: string;
    readonly nomeFantasia: string;
    readonly email: string;
    readonly subdomain: string;
    readonly schemaName: string;
  };
}

describe('PrismaTenantOnboardingRepository', () => {
  const queryRaw = jest.fn(() => Promise.resolve([]));
  const upsertGlobalUser = jest.fn<
    Promise<{ id: string }>,
    [GlobalUserUpsertInput]
  >(() => Promise.resolve({ id: 'user-id' }));
  const findExistingRun = jest.fn<Promise<ExistingRun | null>, [unknown]>();
  const createOrganization = jest.fn<
    Promise<{ id: string }>,
    [OrganizationCreateInput]
  >(() => Promise.resolve({ id: 'organization-id' }));
  const createTenant = jest.fn(() => Promise.resolve({ id: 'tenant-id' }));
  const createAccess = jest.fn(() => Promise.resolve({ id: 'access-id' }));
  const createRun = jest.fn(() => Promise.resolve({ id: 'run-id' }));
  const findOwnedRun = jest.fn<
    Promise<{ state: string; steps: readonly { id: string }[] } | null>,
    [unknown]
  >();
  const transactionClient = {
    $queryRaw: queryRaw,
    usuarioGlobal: { upsert: upsertGlobalUser },
    provisioningRun: { findFirst: findExistingRun, create: createRun },
    organizacao: { create: createOrganization },
    tenantRegistry: { create: createTenant },
    acessoOrganizacao: { create: createAccess },
  };
  const runTransaction = jest.fn(
    (callback: (client: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient),
  );
  const database = {
    $transaction: runTransaction,
    provisioningRun: { findFirst: findOwnedRun },
  } as unknown as AdminPrismaService;
  const repository = new PrismaTenantOnboardingRepository(database);
  const emailCommand = {
    provider: 'email' as const,
    ownerName: 'Owner',
    ownerEmail: 'owner@example.com',
    farmName: 'Fazenda Aurora',
    passwordHash: 'stored-hash',
  };
  const existingRun = (
    state: string,
    accesses = [{ usuarioGlobalId: 'user-id' }],
  ) => ({
    id: 'existing-run-id',
    state,
    tenantRegistry: {
      id: 'tenant-id',
      schemaName: 'tenant_0123456789abcdef0123456789abcdef',
      organizacao: {
        id: 'organization-id',
        acessos: accesses,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    upsertGlobalUser.mockResolvedValue({ id: 'user-id' });
    findExistingRun.mockResolvedValue(null);
    createOrganization.mockResolvedValue({ id: 'organization-id' });
    createTenant.mockResolvedValue({ id: 'tenant-id' });
    createRun.mockResolvedValue({ id: 'run-id' });
  });

  it('creates a new e-mail tenant graph and returns its orchestration command', async () => {
    const result = await repository.start(emailCommand);

    expect(queryRaw).toHaveBeenCalledTimes(1);
    const globalUserInput = upsertGlobalUser.mock.calls[0][0];
    expect(globalUserInput).toMatchObject({
      where: { email: emailCommand.ownerEmail },
      create: {
        senhaHash: 'stored-hash',
        googleId: undefined,
        authProvider: 'EMAIL',
      },
      update: { nome: 'Owner', senhaHash: 'stored-hash' },
    });
    const organizationInput = createOrganization.mock.calls[0][0];
    expect(organizationInput.data.nomeFantasia).toBe('Fazenda Aurora');
    expect(organizationInput.data.email).toBe(emailCommand.ownerEmail);
    expect(organizationInput.data.subdomain).toMatch(/^owner-[0-9a-f]{8}$/);
    expect(organizationInput.data.schemaName).toMatch(/^tenant_[0-9a-f]{32}$/);
    expect(result).toMatchObject({
      provisioningRunId: 'run-id',
      globalUserId: 'user-id',
      state: 'registered',
      orchestration: {
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        globalUserId: 'user-id',
        bootstrap: {
          passwordHash: 'stored-hash',
          farmName: 'Fazenda Aurora',
        },
      },
    });
  });

  it('resumes an existing Google onboarding and defaults optional bootstrap fields', async () => {
    findExistingRun
      .mockResolvedValueOnce(existingRun('REGISTERED'))
      .mockResolvedValueOnce(existingRun('APPLYING_MIGRATIONS'));
    const command = {
      provider: 'google' as const,
      ownerName: 'Owner',
      ownerEmail: 'owner@example.com',
      providerUserId: 'google-id',
    };

    await expect(repository.start(command)).resolves.toMatchObject({
      state: 'registered',
      orchestration: {
        bootstrap: { passwordHash: '', farmName: 'Fazenda Principal' },
      },
    });
    await expect(repository.start(command)).resolves.toMatchObject({
      state: 'provisioning',
    });
    const globalUserInput = upsertGlobalUser.mock.calls[0][0];
    expect(globalUserInput.create.googleId).toBe('google-id');
    expect(globalUserInput.create.authProvider).toBe('GOOGLE');
    expect(globalUserInput.update).toEqual({
      nome: 'Owner',
      googleId: 'google-id',
      authProvider: 'GOOGLE',
    });
    expect(createOrganization).not.toHaveBeenCalled();
  });

  it('fails closed when an existing run has no owning access', async () => {
    findExistingRun.mockResolvedValue(existingRun('REGISTERED', []));

    await expect(repository.start(emailCommand)).rejects.toThrow(
      'onboardingOwnerMissing',
    );
  });

  it.each([
    ['ACTIVE', [], 'active'],
    ['VALIDATING', [{ id: 'failed-step' }], 'failed'],
    ['REGISTERED', [], 'registered'],
    ['APPLYING_MIGRATIONS', [], 'provisioning'],
  ])('maps %s with its failure set to %s', async (state, steps, expected) => {
    findOwnedRun.mockResolvedValueOnce({ state, steps });

    await expect(repository.findOwnedStatus('run-id', 'user-id')).resolves.toBe(
      expected,
    );
  });

  it('returns undefined when the owned run is absent', async () => {
    findOwnedRun.mockResolvedValueOnce(null);

    await expect(
      repository.findOwnedStatus('missing-run', 'user-id'),
    ).resolves.toBeUndefined();
  });
});
