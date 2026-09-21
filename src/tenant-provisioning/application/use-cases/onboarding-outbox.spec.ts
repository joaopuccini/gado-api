import type { EmailGateway } from '../ports/email.gateway';
import type {
  OnboardingOutboxEvent,
  OnboardingOutboxRepository,
} from '../ports/onboarding-outbox.repository';
import { PrismaOnboardingOutboxRepository } from '../../infrastructure/persistence/prisma/prisma-onboarding-outbox.repository';
import {
  DispatchOnboardingOutboxUseCase,
  type OnboardingOutboxLogger,
} from './dispatch-onboarding-outbox.use-case';

describe('onboarding outbox', () => {
  const now = new Date('2026-09-17T18:00:00.000Z');
  const event: OnboardingOutboxEvent = {
    id: 'outbox-123',
    eventKey: 'tenant-onboarding-active:run-123',
    provisioningRunId: 'run-123',
    recipient: 'owner@example.com',
    templateKey: 'tenant-active',
    payload: { ownerName: 'Owner', tenantName: 'Fazenda Principal' },
    attempts: 1,
  };

  it('activates the run and enqueues one deterministic event in the same transaction', async () => {
    let transactionOpen = false;
    let transactionCommitted = false;
    const runUpdate = jest.fn(() => {
      expect(transactionOpen).toBe(true);
      return Promise.resolve({ id: 'run-123' });
    });
    const registryUpdate = jest.fn(() => {
      expect(transactionOpen).toBe(true);
      return Promise.resolve({ id: 'tenant-123' });
    });
    const outboxUpsert = jest.fn<Promise<{ id: string }>, [unknown]>(() => {
      expect(transactionOpen).toBe(true);
      return Promise.resolve({ id: 'outbox-123' });
    });
    const transaction = {
      provisioningRun: { update: runUpdate },
      tenantRegistry: { update: registryUpdate },
      onboardingOutbox: { upsert: outboxUpsert },
    };
    const database = {
      $transaction: jest.fn(
        async (callback: (client: typeof transaction) => Promise<unknown>) => {
          transactionOpen = true;
          const result = await callback(transaction);
          transactionOpen = false;
          transactionCommitted = true;
          return result;
        },
      ),
    };
    const send = jest.fn();
    const repository = new PrismaOnboardingOutboxRepository(
      database as unknown as ConstructorParameters<
        typeof PrismaOnboardingOutboxRepository
      >[0],
    );

    await repository.activateAndEnqueue({
      provisioningRunId: 'run-123',
      tenantRegistryId: 'tenant-123',
      recipient: event.recipient,
      templateKey: event.templateKey,
      payload: event.payload,
      activatedAt: now,
    });
    await repository.activateAndEnqueue({
      provisioningRunId: 'run-123',
      tenantRegistryId: 'tenant-123',
      recipient: event.recipient,
      templateKey: event.templateKey,
      payload: event.payload,
      activatedAt: now,
    });

    expect(transactionCommitted).toBe(true);
    expect(send.mock.calls).toHaveLength(0);
    expect(runUpdate).toHaveBeenCalledTimes(2);
    expect(registryUpdate).toHaveBeenCalledTimes(2);
    expect(outboxUpsert).toHaveBeenCalledTimes(2);
    expect(outboxUpsert.mock.calls[0]?.[0]).toMatchObject({
      where: { eventKey: 'tenant-onboarding-active:run-123' },
      create: {
        eventKey: 'tenant-onboarding-active:run-123',
        provisioningRunId: 'run-123',
      },
      update: {},
    });
    expect(outboxUpsert.mock.calls[1]?.[0]).toEqual(
      outboxUpsert.mock.calls[0]?.[0],
    );
  });

  it('claims, sends outside the claim transaction, and marks the event sent', async () => {
    let claimCommitted = false;
    const repository = createRepository({
      claimNext: jest.fn<
        ReturnType<OnboardingOutboxRepository['claimNext']>,
        Parameters<OnboardingOutboxRepository['claimNext']>
      >(() => {
        claimCommitted = true;
        return Promise.resolve(event);
      }),
    });
    const send = jest.fn(() => {
      expect(claimCommitted).toBe(true);
      return Promise.resolve();
    });
    const gateway: EmailGateway = {
      send,
    };
    const logger = createLogger();
    const dispatcher = new DispatchOnboardingOutboxUseCase(
      repository,
      gateway,
      logger,
      () => now,
    );

    await expect(dispatcher.execute()).resolves.toBe(true);

    expect(repository.claimNext.mock.calls).toEqual([[now]]);
    expect(send.mock.calls).toEqual([
      [
        {
          recipient: event.recipient,
          templateKey: event.templateKey,
          payload: event.payload,
        },
      ],
    ]);
    expect(repository.markSent.mock.calls).toEqual([[event.id, now]]);
    expect(repository.markFailed.mock.calls).toHaveLength(0);
    expect(logger.info.mock.calls).toEqual([
      [
        {
          provisioningRunId: event.provisioningRunId,
          outboxId: event.id,
          outcome: 'sent',
        },
      ],
    ]);
  });

  it('keeps the tenant active and schedules a sanitized retry after e-mail failure', async () => {
    const repository = createRepository();
    const gateway: EmailGateway = {
      send: jest.fn(() =>
        Promise.reject(
          new Error(
            'token=secret recipient=owner@example.com body=confidential stack=hidden',
          ),
        ),
      ),
    };
    const logger = createLogger();
    const dispatcher = new DispatchOnboardingOutboxUseCase(
      repository,
      gateway,
      logger,
      () => now,
    );

    await expect(dispatcher.execute()).resolves.toBe(false);

    expect(repository.markSent.mock.calls).toHaveLength(0);
    expect(repository.markFailed.mock.calls).toEqual([
      [
        event.id,
        {
          errorCode: 'emailDeliveryFailed',
          nextAttemptAt: new Date('2026-09-17T18:01:00.000Z'),
        },
      ],
    ]);
    expect(logger.warn.mock.calls).toEqual([
      [
        {
          provisioningRunId: event.provisioningRunId,
          outboxId: event.id,
          outcome: 'retryScheduled',
          errorCode: 'emailDeliveryFailed',
        },
      ],
    ]);

    const persistedAndLogged = JSON.stringify({
      failure: repository.markFailed.mock.calls,
      logs: logger.warn.mock.calls,
    });
    expect(persistedAndLogged).not.toContain('owner@example.com');
    expect(persistedAndLogged).not.toContain('confidential');
    expect(persistedAndLogged).not.toContain('secret');
    expect(persistedAndLogged).not.toContain('stack');
  });

  function createRepository(
    overrides: Partial<jest.Mocked<OnboardingOutboxRepository>> = {},
  ): jest.Mocked<OnboardingOutboxRepository> {
    return {
      activateAndEnqueue: jest.fn<
        ReturnType<OnboardingOutboxRepository['activateAndEnqueue']>,
        Parameters<OnboardingOutboxRepository['activateAndEnqueue']>
      >(),
      claimNext: jest.fn<
        ReturnType<OnboardingOutboxRepository['claimNext']>,
        Parameters<OnboardingOutboxRepository['claimNext']>
      >(() => Promise.resolve(event)),
      markSent: jest.fn<
        ReturnType<OnboardingOutboxRepository['markSent']>,
        Parameters<OnboardingOutboxRepository['markSent']>
      >(),
      markFailed: jest.fn<
        ReturnType<OnboardingOutboxRepository['markFailed']>,
        Parameters<OnboardingOutboxRepository['markFailed']>
      >(),
      ...overrides,
    };
  }

  function createLogger(): jest.Mocked<OnboardingOutboxLogger> {
    return {
      info: jest.fn(),
      warn: jest.fn(),
    };
  }
});
