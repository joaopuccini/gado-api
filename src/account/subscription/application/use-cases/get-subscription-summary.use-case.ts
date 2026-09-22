import type { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type { SubscriptionRepository } from '../ports/subscription.repository';

export interface SubscriptionSummaryView {
  readonly planName: string;
  readonly status: 'active' | 'expired' | 'canceled';
  readonly startsAt: string;
  readonly expiresAt: string;
  readonly limits: { readonly users: number; readonly farms: number };
  readonly currentCounts: { readonly users: number; readonly farms: number };
}

export class GetSubscriptionSummaryUseCase {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(): Promise<SubscriptionSummaryView> {
    const { organizationId } = this.context.requireTenantIdentity();
    const summary = await this.subscriptions.findSummary(organizationId);
    if (!summary || summary.organizationId !== organizationId) {
      throw new DomainError(
        'subscriptionUnavailable',
        'Assinatura indisponível',
      );
    }
    const [users, farms] = await Promise.all([
      this.subscriptions.countActiveOrganizationUsers(organizationId),
      this.subscriptions.countActiveTenantFarms(),
    ]);
    return {
      planName: summary.planName,
      status: summary.status,
      startsAt: summary.startsAt.toISOString(),
      expiresAt: summary.expiresAt.toISOString(),
      limits: { users: summary.maxUsers, farms: summary.maxFarms },
      currentCounts: { users, farms },
    };
  }
}
