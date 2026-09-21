import type { PasswordHasher } from '../ports/password-hasher';
import type { ProvisioningExecutor } from '../ports/provisioning-executor';
import type {
  OnboardingProvider,
  TenantOnboardingRepository,
} from '../ports/tenant-onboarding.repository';

export interface StartTenantOnboardingInput {
  readonly provider: OnboardingProvider;
  readonly ownerName: string;
  readonly ownerEmail: string;
  readonly farmName?: string;
  readonly password?: string;
  readonly providerUserId?: string;
}

export interface StartTenantOnboardingOutput {
  readonly provisioningRunId: string;
  readonly globalUserId: string;
  readonly state: 'registered' | 'provisioning';
  readonly statusUrl: string;
}

export class StartTenantOnboardingUseCase {
  constructor(
    private readonly repository: TenantOnboardingRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly executor: ProvisioningExecutor,
  ) {}

  async execute(
    input: StartTenantOnboardingInput,
  ): Promise<StartTenantOnboardingOutput> {
    const ownerEmail = input.ownerEmail.trim().toLowerCase();
    const passwordHash = input.password
      ? await this.passwordHasher.hash(input.password)
      : undefined;
    const started = await this.repository.start({
      provider: input.provider,
      ownerName: input.ownerName.trim(),
      ownerEmail,
      farmName: input.farmName?.trim() || 'Fazenda Principal',
      passwordHash,
      providerUserId: input.providerUserId,
    });

    this.executor.enqueue(started.orchestration);

    return {
      provisioningRunId: started.provisioningRunId,
      globalUserId: started.globalUserId,
      state: started.state,
      statusUrl: `/auth/provisioning/${started.provisioningRunId}`,
    };
  }
}
