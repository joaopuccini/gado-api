import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../common/context';
import { PlanLimitPolicy } from './plan-limit.policy';

interface SubscriptionLimits {
  readonly organizationId: string;
  readonly maxUsers: number;
  readonly maxFarms: number;
  readonly status: 'active' | 'expired';
  readonly expiresAt: Date;
}

interface SubscriptionRepository {
  findLimits(organizationId: string): Promise<SubscriptionLimits | null>;
  countActiveOrganizationUsers(organizationId: string): Promise<number>;
  countActiveTenantFarms(): Promise<number>;
}

const NOW = new Date('2026-09-22T15:00:00.000Z');
const ACTIVE_UNTIL = new Date('2026-10-22T15:00:00.000Z');

const executionContext: ExecutionContextData = {
  requestId: 'request-plan-limits',
  traceId: 'trace-plan-limits',
  contextType: 'tenant',
  startedAt: NOW.getTime(),
  tenantId: 'tenant-a',
  organizationId: 'organization-a',
  schemaName: 'tenant_organization_a',
  globalUserId: 'owner-a',
  localUserId: 1,
  farmId: 10,
  accessibleFarmIds: [10],
  permissions: ['team:manage', 'farms:write'],
};

describe('PlanLimitPolicy', () => {
  let context: ExecutionContextStore;
  let subscriptions: jest.Mocked<SubscriptionRepository>;
  let policy: PlanLimitPolicy;

  beforeEach(() => {
    context = new ExecutionContextStore();
    subscriptions = {
      findLimits: jest.fn().mockResolvedValue({
        organizationId: 'organization-a',
        maxUsers: 3,
        maxFarms: 2,
        status: 'active',
        expiresAt: ACTIVE_UNTIL,
      }),
      countActiveOrganizationUsers: jest.fn().mockResolvedValue(2),
      countActiveTenantFarms: jest.fn().mockResolvedValue(1),
    };
    policy = new PlanLimitPolicy({
      subscriptions,
      context,
      clock: { now: () => NOW },
    });
  });

  const run = <T>(callback: () => Promise<T>) =>
    context.run(executionContext, callback);

  it('allows the next user and farm while active counts are below limits', async () => {
    await expect(run(() => policy.assertCanAddUser())).resolves.toBeUndefined();
    await expect(run(() => policy.assertCanAddFarm())).resolves.toBeUndefined();
    expect(subscriptions.findLimits).toHaveBeenCalledWith('organization-a');
  });

  it('rejects the next active user when count equals maxUsers', async () => {
    subscriptions.countActiveOrganizationUsers.mockResolvedValue(3);

    await expect(run(() => policy.assertCanAddUser())).rejects.toMatchObject({
      code: 'userLimitReached',
    });
  });

  it('rejects the next active farm when count equals maxFarms', async () => {
    subscriptions.countActiveTenantFarms.mockResolvedValue(2);

    await expect(run(() => policy.assertCanAddFarm())).rejects.toMatchObject({
      code: 'farmLimitReached',
    });
  });

  it('uses active counters so inactive users and farms do not consume limits', async () => {
    subscriptions.countActiveOrganizationUsers.mockResolvedValue(2);
    subscriptions.countActiveTenantFarms.mockResolvedValue(1);

    await expect(run(() => policy.assertCanAddUser())).resolves.toBeUndefined();
    await expect(run(() => policy.assertCanAddFarm())).resolves.toBeUndefined();
    expect(subscriptions.countActiveOrganizationUsers.mock.calls).toHaveLength(
      1,
    );
    expect(subscriptions.countActiveTenantFarms.mock.calls).toHaveLength(1);
  });

  it('fails closed when the organization has no subscription', async () => {
    subscriptions.findLimits.mockResolvedValue(null);

    await expect(run(() => policy.assertCanAddUser())).rejects.toMatchObject({
      code: 'subscriptionUnavailable',
    });
    expect(subscriptions.countActiveOrganizationUsers.mock.calls).toHaveLength(
      0,
    );
  });

  it.each([
    {
      status: 'expired' as const,
      expiresAt: ACTIVE_UNTIL,
      label: 'status is expired',
    },
    {
      status: 'active' as const,
      expiresAt: new Date('2026-09-22T14:59:59.000Z'),
      label: 'expiry is in the past',
    },
  ])('fails closed when subscription $label', async ({ status, expiresAt }) => {
    subscriptions.findLimits.mockResolvedValue({
      organizationId: 'organization-a',
      maxUsers: 3,
      maxFarms: 2,
      status,
      expiresAt,
    });

    await expect(run(() => policy.assertCanAddFarm())).rejects.toMatchObject({
      code: 'subscriptionUnavailable',
    });
    expect(subscriptions.countActiveTenantFarms.mock.calls).toHaveLength(0);
  });
});
