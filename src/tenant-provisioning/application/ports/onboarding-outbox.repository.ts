import type { OnboardingEmailPayload } from './email.gateway';

export const ONBOARDING_OUTBOX_REPOSITORY = Symbol(
  'ONBOARDING_OUTBOX_REPOSITORY',
);

export interface ActivateTenantWithOnboardingCommand {
  readonly provisioningRunId: string;
  readonly tenantRegistryId: string;
  readonly recipient: string;
  readonly templateKey: string;
  readonly payload: OnboardingEmailPayload;
  readonly activatedAt: Date;
}

export interface OnboardingOutboxEvent {
  readonly id: string;
  readonly eventKey: string;
  readonly provisioningRunId: string;
  readonly recipient: string;
  readonly templateKey: string;
  readonly payload: OnboardingEmailPayload;
  readonly attempts: number;
}

export interface OnboardingOutboxFailure {
  readonly errorCode: 'emailDeliveryFailed';
  readonly nextAttemptAt: Date;
}

export interface OnboardingOutboxRepository {
  activateAndEnqueue(
    command: ActivateTenantWithOnboardingCommand,
  ): Promise<void>;
  claimNext(now: Date): Promise<OnboardingOutboxEvent | null>;
  markSent(outboxId: string, sentAt: Date): Promise<void>;
  markFailed(outboxId: string, failure: OnboardingOutboxFailure): Promise<void>;
}
