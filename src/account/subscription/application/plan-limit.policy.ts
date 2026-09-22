import type { ExecutionContextStore } from '../../../common/context';
import { DomainError } from '../../../common/errors/domain-error';
import type {
  SubscriptionLimits,
  SubscriptionRepository,
} from './ports/subscription.repository';

interface PlanLimitPolicyDependencies {
  readonly subscriptions: SubscriptionRepository;
  readonly context: ExecutionContextStore;
  readonly clock: { now(): Date };
}

export class PlanLimitPolicy {
  constructor(private readonly dependencies: PlanLimitPolicyDependencies) {}

  async assertCanAddUser(): Promise<void> {
    const limits = await this.requireActiveLimits();
    const count =
      await this.dependencies.subscriptions.countActiveOrganizationUsers(
        limits.organizationId,
      );
    if (count >= limits.maxUsers) {
      throw new DomainError('userLimitReached', 'Limite de usuários atingido');
    }
  }

  async assertCanAddFarm(): Promise<void> {
    const limits = await this.requireActiveLimits();
    const count =
      await this.dependencies.subscriptions.countActiveTenantFarms();
    if (count >= limits.maxFarms) {
      throw new DomainError('farmLimitReached', 'Limite de fazendas atingido');
    }
  }

  private async requireActiveLimits(): Promise<SubscriptionLimits> {
    const { organizationId } =
      this.dependencies.context.requireTenantIdentity();
    const limits =
      await this.dependencies.subscriptions.findLimits(organizationId);
    if (
      !limits ||
      limits.organizationId !== organizationId ||
      limits.status !== 'active' ||
      limits.expiresAt.getTime() <= this.dependencies.clock.now().getTime()
    ) {
      throw new DomainError(
        'subscriptionUnavailable',
        'Assinatura indisponível',
      );
    }
    return limits;
  }
}
