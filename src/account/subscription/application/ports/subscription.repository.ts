export interface SubscriptionLimits {
  readonly organizationId: string;
  readonly maxUsers: number;
  readonly maxFarms: number;
  readonly status: 'active' | 'expired';
  readonly expiresAt: Date;
}

export interface SubscriptionRepository {
  findLimits(organizationId: string): Promise<SubscriptionLimits | null>;
  countActiveOrganizationUsers(organizationId: string): Promise<number>;
  countActiveTenantFarms(): Promise<number>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');
