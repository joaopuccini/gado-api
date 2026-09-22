import {
  ExecutionContextStore,
  type ExecutionContextData,
} from '../../../common/context';
import type { SubscriptionRepository } from './ports/subscription.repository';
import { GetSubscriptionSummaryUseCase } from './get-subscription-summary.use-case';

const contextData = (organizationId: string): ExecutionContextData => ({
  requestId: 'request-1',
  traceId: 'trace-1',
  contextType: 'tenant',
  startedAt: 0,
  tenantId: 'tenant-1',
  organizationId,
  schemaName: 'tenant_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  globalUserId: 'user-1',
  accessibleFarmIds: [1],
  permissions: ['configuracoes:ler'],
});

describe('GetSubscriptionSummaryUseCase', () => {
  const context = new ExecutionContextStore();
  const subscriptions: jest.Mocked<SubscriptionRepository> = {
    findLimits: jest.fn(),
    findSummary: jest.fn(),
    countActiveOrganizationUsers: jest.fn(),
    countActiveTenantFarms: jest.fn(),
  };
  const useCase = new GetSubscriptionSummaryUseCase(subscriptions, context);

  beforeEach(() => jest.clearAllMocks());

  it('combines the verified subscription with current admin and tenant counts', async () => {
    subscriptions.findSummary.mockResolvedValue({
      organizationId: 'organization-a',
      planName: 'Profissional',
      status: 'active',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      expiresAt: new Date('2026-10-01T00:00:00.000Z'),
      maxUsers: 10,
      maxFarms: 3,
    });
    subscriptions.countActiveOrganizationUsers.mockResolvedValue(4);
    subscriptions.countActiveTenantFarms.mockResolvedValue(2);

    const result = await context.run(contextData('organization-a'), () =>
      useCase.execute(),
    );

    expect(subscriptions.findSummary.mock.calls).toEqual([['organization-a']]);
    expect(subscriptions.countActiveOrganizationUsers.mock.calls).toEqual([
      ['organization-a'],
    ]);
    expect(result).toEqual({
      planName: 'Profissional',
      status: 'active',
      startsAt: '2026-09-01T00:00:00.000Z',
      expiresAt: '2026-10-01T00:00:00.000Z',
      limits: { users: 10, farms: 3 },
      currentCounts: { users: 4, farms: 2 },
    });
  });

  it('fails closed before counting when the subscription crosses organizations', async () => {
    subscriptions.findSummary.mockResolvedValue({
      organizationId: 'organization-b',
      planName: 'Outro',
      status: 'active',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      expiresAt: new Date('2026-10-01T00:00:00.000Z'),
      maxUsers: 10,
      maxFarms: 3,
    });

    await expect(
      context.run(contextData('organization-a'), () => useCase.execute()),
    ).rejects.toMatchObject({ code: 'subscriptionUnavailable' });
    expect(subscriptions.countActiveOrganizationUsers.mock.calls).toHaveLength(
      0,
    );
    expect(subscriptions.countActiveTenantFarms.mock.calls).toHaveLength(0);
  });
});
