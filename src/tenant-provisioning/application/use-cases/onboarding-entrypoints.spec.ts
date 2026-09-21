import type { PasswordHasher } from '../ports/password-hasher';
import type { ProvisioningExecutor } from '../ports/provisioning-executor';
import type { TenantOnboardingRepository } from '../ports/tenant-onboarding.repository';
import { GetProvisioningStatusUseCase } from './get-provisioning-status.use-case';
import { StartTenantOnboardingUseCase } from './start-tenant-onboarding.use-case';

describe('tenant onboarding entrypoints', () => {
  const orchestration = {
    tenantId: 'tenant-id',
    organizationId: 'organization-id',
    schemaName: 'tenant_0123456789abcdef0123456789abcdef',
    globalUserId: 'global-user-id',
    bootstrap: {
      provisioningRunId: 'run-id',
      globalUserId: 'global-user-id',
      ownerName: 'Owner',
      ownerEmail: 'owner@example.com',
      passwordHash: 'stored-hash',
      farmName: 'Fazenda Principal',
    },
  };
  const start = jest.fn<
    ReturnType<TenantOnboardingRepository['start']>,
    Parameters<TenantOnboardingRepository['start']>
  >();
  const findOwnedStatus = jest.fn<
    ReturnType<TenantOnboardingRepository['findOwnedStatus']>,
    Parameters<TenantOnboardingRepository['findOwnedStatus']>
  >();
  const hash = jest.fn<
    ReturnType<PasswordHasher['hash']>,
    Parameters<PasswordHasher['hash']>
  >();
  const enqueue = jest.fn<
    ReturnType<ProvisioningExecutor['enqueue']>,
    Parameters<ProvisioningExecutor['enqueue']>
  >();
  const repository: jest.Mocked<TenantOnboardingRepository> = {
    start,
    findOwnedStatus,
  };
  const passwordHasher: jest.Mocked<PasswordHasher> = { hash };
  const executor: jest.Mocked<ProvisioningExecutor> = { enqueue };

  beforeEach(() => {
    jest.clearAllMocks();
    hash.mockResolvedValue('stored-hash');
    start.mockResolvedValue({
      provisioningRunId: 'run-id',
      globalUserId: 'global-user-id',
      state: 'registered',
      orchestration,
    });
  });

  it('normalizes e-mail onboarding, hashes its password and defaults a blank farm', async () => {
    const useCase = new StartTenantOnboardingUseCase(
      repository,
      passwordHasher,
      executor,
    );

    await expect(
      useCase.execute({
        provider: 'email',
        ownerName: ' Owner ',
        ownerEmail: ' OWNER@EXAMPLE.COM ',
        password: 'secret',
        farmName: '   ',
      }),
    ).resolves.toEqual({
      provisioningRunId: 'run-id',
      globalUserId: 'global-user-id',
      state: 'registered',
      statusUrl: '/auth/provisioning/run-id',
    });
    expect(hash).toHaveBeenCalledWith('secret');
    expect(start).toHaveBeenCalledWith({
      provider: 'email',
      ownerName: 'Owner',
      ownerEmail: 'owner@example.com',
      farmName: 'Fazenda Principal',
      passwordHash: 'stored-hash',
      providerUserId: undefined,
    });
    expect(enqueue).toHaveBeenCalledWith(orchestration);
  });

  it('starts Google onboarding without hashing a password', async () => {
    const useCase = new StartTenantOnboardingUseCase(
      repository,
      passwordHasher,
      executor,
    );

    await useCase.execute({
      provider: 'google',
      ownerName: 'Owner',
      ownerEmail: 'owner@example.com',
      providerUserId: 'google-id',
    });

    expect(hash).not.toHaveBeenCalled();
    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        passwordHash: undefined,
        providerUserId: 'google-id',
      }),
    );
  });

  it('returns an owned public status and rejects an unknown run', async () => {
    const useCase = new GetProvisioningStatusUseCase(repository);
    findOwnedStatus
      .mockResolvedValueOnce('active')
      .mockResolvedValueOnce(undefined);

    await expect(useCase.execute('run-id', 'global-user-id')).resolves.toEqual({
      provisioningRunId: 'run-id',
      state: 'active',
    });
    await expect(
      useCase.execute('missing-run', 'global-user-id'),
    ).rejects.toMatchObject({ code: 'resourceNotFound' });
  });
});
