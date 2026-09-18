import { ExecutionContextStore } from '../../../common/context';
import { ProvisioningState } from '../../domain/provisioning-run';
import type { OnboardingOutboxRepository } from '../ports/onboarding-outbox.repository';
import type {
  CreateOrLoadProvisioningRunCommand,
  ProvisioningRunRepository,
} from '../ports/provisioning-run.repository';
import { ProvisionTenantOrchestratorUseCase } from './provision-tenant-orchestrator.use-case';

type StageName =
  | 'createSchema'
  | 'migrateSchema'
  | 'syncPermissions'
  | 'seedProfiles'
  | 'bootstrapTenant'
  | 'validateTenant'
  | 'activateTenant';

interface RetryScenario {
  readonly failingStage: StageName;
  readonly expectedAttempts: Readonly<Record<StageName, number>>;
}

describe('ProvisionTenantOrchestratorUseCase retries', () => {
  const schemaName = 'tenant_0123456789abcdef0123456789abcdef';
  const command = {
    tenantId: 'tenant-id',
    organizationId: 'organization-id',
    schemaName,
    globalUserId: 'global-user-id',
    bootstrap: {
      provisioningRunId: '11111111-1111-4111-8111-111111111111',
      globalUserId: 'global-user-id',
      ownerName: 'Owner',
      ownerEmail: 'owner@example.com',
      passwordHash: 'stored-hash',
      farmName: 'Fazenda Principal',
    },
  };
  const finalCounts = {
    permissions: 42,
    systemProfiles: 5,
    owners: 1,
    farms: 1,
    ownerFarmLinks: 1,
    outboxEvents: 1,
  };
  const scenarios: RetryScenario[] = [
    {
      failingStage: 'createSchema',
      expectedAttempts: {
        createSchema: 2,
        migrateSchema: 1,
        syncPermissions: 1,
        seedProfiles: 1,
        bootstrapTenant: 1,
        validateTenant: 1,
        activateTenant: 1,
      },
    },
    {
      failingStage: 'migrateSchema',
      expectedAttempts: {
        createSchema: 1,
        migrateSchema: 2,
        syncPermissions: 1,
        seedProfiles: 1,
        bootstrapTenant: 1,
        validateTenant: 1,
        activateTenant: 1,
      },
    },
    {
      failingStage: 'syncPermissions',
      expectedAttempts: {
        createSchema: 1,
        migrateSchema: 1,
        syncPermissions: 2,
        seedProfiles: 1,
        bootstrapTenant: 1,
        validateTenant: 1,
        activateTenant: 1,
      },
    },
    {
      failingStage: 'seedProfiles',
      expectedAttempts: {
        createSchema: 1,
        migrateSchema: 1,
        syncPermissions: 1,
        seedProfiles: 2,
        bootstrapTenant: 1,
        validateTenant: 1,
        activateTenant: 1,
      },
    },
    {
      failingStage: 'bootstrapTenant',
      expectedAttempts: {
        createSchema: 1,
        migrateSchema: 1,
        syncPermissions: 1,
        seedProfiles: 1,
        bootstrapTenant: 2,
        validateTenant: 1,
        activateTenant: 1,
      },
    },
    {
      failingStage: 'validateTenant',
      expectedAttempts: {
        createSchema: 1,
        migrateSchema: 1,
        syncPermissions: 1,
        seedProfiles: 1,
        bootstrapTenant: 1,
        validateTenant: 2,
        activateTenant: 1,
      },
    },
    {
      failingStage: 'activateTenant',
      expectedAttempts: {
        createSchema: 1,
        migrateSchema: 1,
        syncPermissions: 1,
        seedProfiles: 1,
        bootstrapTenant: 1,
        validateTenant: 1,
        activateTenant: 2,
      },
    },
  ];

  it.each(scenarios)(
    'resumes from $failingStage without duplicating completed resources',
    async ({ failingStage, expectedAttempts }) => {
      const harness = createHarness(failingStage);

      await expect(harness.orchestrator.execute(command)).rejects.toThrow(
        `${failingStage} failed`,
      );
      await expect(
        harness.orchestrator.execute(command),
      ).resolves.toBeUndefined();

      expect(harness.stageAttempts()).toEqual(expectedAttempts);
      expect(harness.repository.completeRun.mock.calls).toEqual([
        [command.bootstrap.provisioningRunId],
      ]);
      expect(harness.repository.snapshotCounts.mock.calls).toEqual([
        [command.bootstrap.provisioningRunId],
      ]);
      expect(
        await harness.repository.snapshotCounts(
          command.bootstrap.provisioningRunId,
        ),
      ).toEqual(finalCounts);
    },
  );

  it('collapses concurrent starts with the same idempotency key into one run and tenant registry', async () => {
    const harness = createHarness();

    await Promise.all([
      harness.orchestrator.execute(command),
      harness.orchestrator.execute(command),
    ]);

    expect(harness.repository.createOrLoadByIdempotencyKey.mock.calls).toEqual([
      [
        {
          idempotencyKey: 'tenant-id:global-user-id',
          provisioningRunId: command.bootstrap.provisioningRunId,
          tenantRegistryId: command.tenantId,
        },
      ],
      [
        {
          idempotencyKey: 'tenant-id:global-user-id',
          provisioningRunId: command.bootstrap.provisioningRunId,
          tenantRegistryId: command.tenantId,
        },
      ],
    ]);
    expect(harness.repository.createdRuns()).toBe(1);
    expect(harness.repository.createdTenantRegistries()).toBe(1);
    expect(harness.stageAttempts()).toEqual({
      createSchema: 1,
      migrateSchema: 1,
      syncPermissions: 1,
      seedProfiles: 1,
      bootstrapTenant: 1,
      validateTenant: 1,
      activateTenant: 1,
    });
  });

  function createHarness(failingStage?: StageName) {
    const context = new ExecutionContextStore();
    const calls = new Map<StageName, number>();
    const stage = (name: StageName) => ({
      execute: jest.fn(() => {
        expect(context.requireTenantIdentity()).toMatchObject({
          contextType: 'job',
          tenantId: command.tenantId,
          organizationId: command.organizationId,
          schemaName,
          globalUserId: command.globalUserId,
        });
        calls.set(name, (calls.get(name) ?? 0) + 1);
        if (name === failingStage && calls.get(name) === 1) {
          return Promise.reject(new Error(`${name} failed`));
        }
        return Promise.resolve(undefined);
      }),
    });
    const createSchema = stage('createSchema');
    const migrateSchema = stage('migrateSchema');
    const syncPermissions = stage('syncPermissions');
    const seedProfiles = stage('seedProfiles');
    const bootstrapTenant = stage('bootstrapTenant');
    const validateTenant = stage('validateTenant');
    const activateTenant = stage('activateTenant');
    const repository = createRunRepository();
    const outboxRepository = createOutboxRepository();
    const orchestrator = new ProvisionTenantOrchestratorUseCase(
      context,
      repository,
      createSchema,
      migrateSchema,
      syncPermissions,
      seedProfiles,
      bootstrapTenant,
      validateTenant,
      activateTenant,
      outboxRepository,
      () => 'request-id',
      () => 123,
    );

    return {
      orchestrator,
      repository,
      stageAttempts: () =>
        Object.fromEntries(
          (
            [
              'createSchema',
              'migrateSchema',
              'syncPermissions',
              'seedProfiles',
              'bootstrapTenant',
              'validateTenant',
              'activateTenant',
            ] satisfies StageName[]
          ).map((name) => [name, calls.get(name) ?? 0]),
        ) as Record<StageName, number>,
    };
  }

  function createRunRepository(): jest.Mocked<ProvisioningRunRepository> & {
    createdRuns(): number;
    createdTenantRegistries(): number;
  } {
    let runs = 0;
    let tenantRegistries = 0;
    const completedStages = new Set<StageName>();
    const repository = {
      createOrLoadByIdempotencyKey: jest.fn(
        (request: CreateOrLoadProvisioningRunCommand) => {
          if (
            request.idempotencyKey === 'tenant-id:global-user-id' &&
            runs === 0
          ) {
            runs += 1;
            tenantRegistries += 1;
          }
          return Promise.resolve({
            provisioningRunId: command.bootstrap.provisioningRunId,
            tenantRegistryId: command.tenantId,
            state: ProvisioningState.REGISTERED,
          });
        },
      ),
      loadPersistedState: jest.fn(() =>
        Promise.resolve({
          nextStage:
            (
              [
                'createSchema',
                'migrateSchema',
                'syncPermissions',
                'seedProfiles',
                'bootstrapTenant',
                'validateTenant',
                'activateTenant',
              ] satisfies StageName[]
            ).find((stage) => !completedStages.has(stage)) ??
            ('activateTenant' as StageName),
        }),
      ),
      beginStep: jest.fn((_runId: string, stage: StageName) =>
        Promise.resolve(!completedStages.has(stage)),
      ),
      completeStep: jest.fn((_runId: string, stage: StageName) => {
        completedStages.add(stage);
        return Promise.resolve(undefined);
      }),
      failStep: jest.fn(() => Promise.resolve(undefined)),
      completeRun: jest.fn(() => Promise.resolve(undefined)),
      snapshotCounts: jest.fn(() => Promise.resolve(finalCounts)),
      createdRuns: () => runs,
      createdTenantRegistries: () => tenantRegistries,
    };

    return repository;
  }

  function createOutboxRepository(): jest.Mocked<OnboardingOutboxRepository> {
    return {
      activateAndEnqueue: jest.fn(() => Promise.resolve(undefined)),
      claimNext: jest.fn(() => Promise.resolve(null)),
      markSent: jest.fn(() => Promise.resolve(undefined)),
      markFailed: jest.fn(() => Promise.resolve(undefined)),
    };
  }
});
