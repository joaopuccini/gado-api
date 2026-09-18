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
    const runUpdate = jest.fn(async () => {
      expect(transactionOpen).toBe(true);
      return { id: 'run-123' };
    });
    const registryUpdate = jest.fn(async () => {
      expect(transactionOpen).toBe(true);
      return { id: 'tenant-123' };
    });
    const outboxUpsert = jest.fn(async () => {
      expect(transactionOpen).toBe(true);
      return { id: 'outbox-123' };
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
    const gateway: EmailGateway = { send: jest.fn() };
    const repository = new PrismaOnboardingOutboxRepository(
      database as ConstructorParameters<
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
    expect(gateway.send).not.toHaveBeenCalled();
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
      claimNext: jest.fn(async () => {
        claimCommitted = true;
        return event;
      }),
    });
    const gateway: EmailGateway = {
      send: jest.fn(async () => {
        expect(claimCommitted).toBe(true);
      }),
    };
    const logger = createLogger();
    const dispatcher = new DispatchOnboardingOutboxUseCase(
      repository,
      gateway,
      logger,
      () => now,
    );

    await expect(dispatcher.execute()).resolves.toBe(true);

    expect(repository.claimNext).toHaveBeenCalledWith(now);
    expect(gateway.send).toHaveBeenCalledWith({
      recipient: event.recipient,
      templateKey: event.templateKey,
      payload: event.payload,
    });
    expect(repository.markSent).toHaveBeenCalledWith(event.id, now);
    expect(repository.markFailed).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith({
      provisioningRunId: event.provisioningRunId,
      outboxId: event.id,
      outcome: 'sent',
    });
  });

  it('keeps the tenant active and schedules a sanitized retry after e-mail failure', async () => {
    const repository = createRepository();
    const gateway: EmailGateway = {
      send: jest.fn(async () => {
        throw new Error(
          'token=secret recipient=owner@example.com body=confidential stack=hidden',
        );
      }),
    };
    const logger = createLogger();
    const dispatcher = new DispatchOnboardingOutboxUseCase(
      repository,
      gateway,
      logger,
      () => now,
    );

    await expect(dispatcher.execute()).resolves.toBe(false);

    expect(repository.markSent).not.toHaveBeenCalled();
    expect(repository.markFailed).toHaveBeenCalledWith(event.id, {
      errorCode: 'emailDeliveryFailed',
      nextAttemptAt: new Date('2026-09-17T18:01:00.000Z'),
    });
    expect(logger.warn).toHaveBeenCalledWith({
      provisioningRunId: event.provisioningRunId,
      outboxId: event.id,
      outcome: 'retryScheduled',
      errorCode: 'emailDeliveryFailed',
    });

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
      activateAndEnqueue: jest.fn(),
      claimNext: jest.fn(async () => event),
      markSent: jest.fn(),
      markFailed: jest.fn(),
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
