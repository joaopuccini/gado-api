import type { EmailGateway } from '../ports/email.gateway';
import type { OnboardingOutboxRepository } from '../ports/onboarding-outbox.repository';

export interface OnboardingOutboxLogFields {
  readonly provisioningRunId: string;
  readonly outboxId: string;
  readonly outcome: 'sent' | 'retryScheduled';
  readonly errorCode?: 'emailDeliveryFailed';
}

export interface OnboardingOutboxLogger {
  info(fields: OnboardingOutboxLogFields): void;
  warn(fields: OnboardingOutboxLogFields): void;
}

const retryDelayMs = (attempts: number): number =>
  Math.min(60_000 * 2 ** Math.max(attempts - 1, 0), 3_600_000);

export class DispatchOnboardingOutboxUseCase {
  constructor(
    private readonly repository: OnboardingOutboxRepository,
    private readonly gateway: EmailGateway,
    private readonly logger: OnboardingOutboxLogger,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<boolean> {
    const claimedAt = this.now();
    const event = await this.repository.claimNext(claimedAt);
    if (!event) return false;

    try {
      await this.gateway.send({
        recipient: event.recipient,
        templateKey: event.templateKey,
        payload: event.payload,
      });
      const sentAt = this.now();
      await this.repository.markSent(event.id, sentAt);
      this.logger.info({
        provisioningRunId: event.provisioningRunId,
        outboxId: event.id,
        outcome: 'sent',
      });
      return true;
    } catch {
      const failedAt = this.now();
      await this.repository.markFailed(event.id, {
        errorCode: 'emailDeliveryFailed',
        nextAttemptAt: new Date(
          failedAt.getTime() + retryDelayMs(event.attempts),
        ),
      });
      this.logger.warn({
        provisioningRunId: event.provisioningRunId,
        outboxId: event.id,
        outcome: 'retryScheduled',
        errorCode: 'emailDeliveryFailed',
      });
      return false;
    }
  }
}
