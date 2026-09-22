export interface SubscriptionLimits {
  readonly organizationId: string;
  readonly maxUsers: number;
  readonly maxFarms: number;
  readonly status: 'active' | 'expired';
  readonly expiresAt: Date;
}

export interface SubscriptionSummaryRecord {
  readonly organizationId: string;
  readonly planName: string;
  readonly status: 'active' | 'expired' | 'canceled';
  readonly startsAt: Date;
  readonly expiresAt: Date;
  readonly maxUsers: number;
  readonly maxFarms: number;
}

export interface SubscriptionRepository {
  findLimits(organizationId: string): Promise<SubscriptionLimits | null>;
  findSummary(
    organizationId: string,
  ): Promise<SubscriptionSummaryRecord | null>;
  countActiveOrganizationUsers(organizationId: string): Promise<number>;
  countActiveTenantFarms(): Promise<number>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');
