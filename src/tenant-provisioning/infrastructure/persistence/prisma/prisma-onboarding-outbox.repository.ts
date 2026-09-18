import { AdminPrismaService } from '../../../../admin/admin-prisma.service';
import type { OnboardingEmailPayload } from '../../../application/ports/email.gateway';
import type {
  ActivateTenantWithOnboardingCommand,
  OnboardingOutboxEvent,
  OnboardingOutboxFailure,
  OnboardingOutboxRepository,
} from '../../../application/ports/onboarding-outbox.repository';

interface ClaimedOutboxRow {
  readonly id: string;
  readonly eventKey: string;
  readonly provisioningRunId: string;
  readonly recipient: string;
  readonly templateKey: string;
  readonly payload: unknown;
  readonly attempts: number;
}

const payloadFrom = (value: unknown): OnboardingEmailPayload => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
};

export class PrismaOnboardingOutboxRepository implements OnboardingOutboxRepository {
  constructor(private readonly database: AdminPrismaService) {}

  async activateAndEnqueue(
    command: ActivateTenantWithOnboardingCommand,
  ): Promise<void> {
    const eventKey = `tenant-onboarding-active:${command.provisioningRunId}`;

    await this.database.$transaction(async (transaction) => {
      await transaction.provisioningRun.update({
        where: { id: command.provisioningRunId },
        data: { state: 'ACTIVE', completedAt: command.activatedAt },
      });
      await transaction.tenantRegistry.update({
        where: { id: command.tenantRegistryId },
        data: { status: 'ATIVO', provisionedAt: command.activatedAt },
      });
      await transaction.onboardingOutbox.upsert({
        where: { eventKey },
        create: {
          eventKey,
          provisioningRunId: command.provisioningRunId,
          recipient: command.recipient,
          templateKey: command.templateKey,
          payload: command.payload,
          nextAttemptAt: command.activatedAt,
        },
        update: {},
      });
    });
  }

  async claimNext(now: Date): Promise<OnboardingOutboxEvent | null> {
    return this.database.$transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<ClaimedOutboxRow[]>`
        SELECT
          "id",
          "event_key" AS "eventKey",
          "provisioning_run_id" AS "provisioningRunId",
          "recipient",
          "template_key" AS "templateKey",
          "payload",
          "attempts"
        FROM "gado_admin"."onboarding_outbox"
        WHERE "status" IN ('PENDING', 'FAILED')
          AND "next_attempt_at" <= ${now}
        ORDER BY "next_attempt_at", "created_at"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `;
      const row = rows[0];
      if (!row) return null;

      await transaction.onboardingOutbox.update({
        where: { id: row.id },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
          errorCode: null,
        },
      });

      return {
        id: row.id,
        eventKey: row.eventKey,
        provisioningRunId: row.provisioningRunId,
        recipient: row.recipient,
        templateKey: row.templateKey,
        payload: payloadFrom(row.payload),
        attempts: row.attempts + 1,
      };
    });
  }

  async markSent(outboxId: string, sentAt: Date): Promise<void> {
    await this.database.onboardingOutbox.updateMany({
      where: { id: outboxId, status: 'PROCESSING' },
      data: {
        status: 'SENT',
        sentAt,
        errorCode: null,
      },
    });
  }

  async markFailed(
    outboxId: string,
    failure: OnboardingOutboxFailure,
  ): Promise<void> {
    await this.database.onboardingOutbox.updateMany({
      where: { id: outboxId, status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        errorCode: failure.errorCode,
        nextAttemptAt: failure.nextAttemptAt,
      },
    });
  }
}
