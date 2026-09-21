import type { ProvisionTenantOrchestratorCommand } from '../use-cases/provision-tenant-orchestrator.use-case';

export const TENANT_ONBOARDING_REPOSITORY = Symbol(
  'TENANT_ONBOARDING_REPOSITORY',
);

export type OnboardingProvider = 'email' | 'google';
export type PublicProvisioningState =
  | 'registered'
  | 'provisioning'
  | 'active'
  | 'failed';

export interface StartTenantOnboardingCommand {
  readonly provider: OnboardingProvider;
  readonly ownerName: string;
  readonly ownerEmail: string;
  readonly farmName?: string;
  readonly passwordHash?: string;
  readonly providerUserId?: string;
}

export interface StartedTenantOnboarding {
  readonly provisioningRunId: string;
  readonly globalUserId: string;
  readonly state: 'registered' | 'provisioning';
  readonly orchestration: ProvisionTenantOrchestratorCommand;
}

export interface TenantOnboardingRepository {
  start(
    command: StartTenantOnboardingCommand,
  ): Promise<StartedTenantOnboarding>;
  findOwnedStatus(
    provisioningRunId: string,
    globalUserId: string,
  ): Promise<PublicProvisioningState | undefined>;
}
