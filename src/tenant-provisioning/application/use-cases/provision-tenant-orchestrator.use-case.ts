import { randomUUID } from 'node:crypto';
import { ExecutionContextStore } from '../../../common/context';
import { TenantSchemaName } from '../../../tenant/domain/tenant-schema-name';
import type { OnboardingOutboxRepository } from '../ports/onboarding-outbox.repository';
import type {
  ProvisioningRunRepository,
  ProvisioningStageName,
} from '../ports/provisioning-run.repository';
import type { TenantBootstrapCommand } from '../ports/tenant-bootstrap.repository';

interface ProvisioningStage {
  execute(command?: TenantBootstrapCommand): Promise<unknown>;
}

export interface ProvisionTenantOrchestratorCommand {
  readonly tenantId: string;
  readonly organizationId: string;
  readonly schemaName: string;
  readonly globalUserId: string;
  readonly bootstrap: TenantBootstrapCommand;
}

export class ProvisionTenantOrchestratorUseCase {
  private readonly runRepository: ProvisioningRunRepository | undefined;
  private readonly createSchema: ProvisioningStage;
  private readonly migrateSchema: ProvisioningStage;
  private readonly syncPermissions: ProvisioningStage;
  private readonly seedProfiles: ProvisioningStage;
  private readonly bootstrapTenant: ProvisioningStage;
  private readonly validateTenant: ProvisioningStage | undefined;
  private readonly activateTenant: ProvisioningStage | undefined;
  private readonly outboxRepository: OnboardingOutboxRepository | undefined;
  private readonly requestIdFactory: () => string;
  private readonly now: () => number;
  private readonly inFlightRuns = new Map<string, Promise<void>>();

  constructor(
    private readonly context: ExecutionContextStore,
    runRepositoryOrCreateSchema: ProvisioningRunRepository | ProvisioningStage,
    createSchemaOrMigrateSchema: ProvisioningStage,
    migrateSchemaOrSyncPermissions: ProvisioningStage,
    syncPermissionsOrSeedProfiles: ProvisioningStage,
    seedProfilesOrProvisionTenant: ProvisioningStage,
    bootstrapTenantOrRequestIdFactory?: ProvisioningStage | (() => string),
    validateTenantOrNow?: ProvisioningStage | (() => number),
    activateTenant?: ProvisioningStage,
    outboxRepository?: OnboardingOutboxRepository,
    requestIdFactory: () => string = randomUUID,
    now: () => number = Date.now,
  ) {
    if (isRunRepository(runRepositoryOrCreateSchema)) {
      this.runRepository = runRepositoryOrCreateSchema;
      this.createSchema = createSchemaOrMigrateSchema;
      this.migrateSchema = migrateSchemaOrSyncPermissions;
      this.syncPermissions = syncPermissionsOrSeedProfiles;
      this.seedProfiles = seedProfilesOrProvisionTenant;
      this.bootstrapTenant = requireStage(bootstrapTenantOrRequestIdFactory);
      this.validateTenant = requireStage(validateTenantOrNow);
      this.activateTenant = activateTenant;
      this.outboxRepository = outboxRepository;
      this.requestIdFactory = requestIdFactory;
      this.now = now;
      return;
    }

    this.createSchema = runRepositoryOrCreateSchema;
    this.migrateSchema = createSchemaOrMigrateSchema;
    this.syncPermissions = migrateSchemaOrSyncPermissions;
    this.seedProfiles = syncPermissionsOrSeedProfiles;
    this.bootstrapTenant = seedProfilesOrProvisionTenant;
    this.requestIdFactory =
      typeof bootstrapTenantOrRequestIdFactory === 'function'
        ? bootstrapTenantOrRequestIdFactory
        : randomUUID;
    this.now =
      typeof validateTenantOrNow === 'function'
        ? validateTenantOrNow
        : Date.now;
  }

  async execute(command: ProvisionTenantOrchestratorCommand): Promise<void> {
    const schemaName = TenantSchemaName.parse(command.schemaName).value;
    const requestId = this.requestIdFactory();
    const runRepository = this.runRepository;

    if (runRepository) {
      const run = await runRepository.createOrLoadByIdempotencyKey({
        idempotencyKey: `${command.tenantId}:${command.globalUserId}`,
        provisioningRunId: command.bootstrap.provisioningRunId,
        tenantRegistryId: command.tenantId,
      });
      const inFlight = this.inFlightRuns.get(run.provisioningRunId);
      if (inFlight) return inFlight;

      const execution = this.executePersisted(
        command,
        schemaName,
        requestId,
        run.provisioningRunId,
      );
      this.inFlightRuns.set(run.provisioningRunId, execution);
      try {
        await execution;
      } finally {
        this.inFlightRuns.delete(run.provisioningRunId);
      }
      return;
    }

    await this.context.run(
      {
        requestId,
        traceId: requestId,
        contextType: 'job',
        startedAt: this.now(),
        tenantId: command.tenantId,
        organizationId: command.organizationId,
        schemaName,
        globalUserId: command.globalUserId,
        accessibleFarmIds: [],
        permissions: ['tenant.provision'],
      },
      async () => {
        await this.createSchema.execute();
        await this.migrateSchema.execute();
        await this.syncPermissions.execute();
        await this.seedProfiles.execute();
        await this.bootstrapTenant.execute(command.bootstrap);
      },
    );
  }

  private async executePersisted(
    command: ProvisionTenantOrchestratorCommand,
    schemaName: string,
    requestId: string,
    provisioningRunId: string,
  ): Promise<void> {
    const runRepository = this.requireRunRepository();

    await this.context.run(
      {
        requestId,
        traceId: requestId,
        contextType: 'job',
        startedAt: this.now(),
        tenantId: command.tenantId,
        organizationId: command.organizationId,
        schemaName,
        globalUserId: command.globalUserId,
        accessibleFarmIds: [],
        permissions: ['tenant.provision'],
      },
      async () => {
        const persisted =
          await runRepository.loadPersistedState(provisioningRunId);
        let shouldExecute = false;
        for (const stage of this.persistedStages(command)) {
          shouldExecute ||= stage.name === persisted.nextStage;
          if (!shouldExecute) continue;

          const started = await runRepository.beginStep(
            provisioningRunId,
            stage.name,
          );
          if (!started) continue;

          try {
            await stage.execute();
            await runRepository.completeStep(provisioningRunId, stage.name);
          } catch (error) {
            await runRepository.failStep(provisioningRunId, stage.name, {
              errorCode: 'provisioningStageFailed',
            });
            throw error;
          }
        }
        await runRepository.completeRun(provisioningRunId);
        await runRepository.snapshotCounts(provisioningRunId);
      },
    );
  }

  private persistedStages(command: ProvisionTenantOrchestratorCommand): Array<{
    readonly name: ProvisioningStageName;
    readonly execute: () => Promise<unknown>;
  }> {
    return [
      { name: 'createSchema', execute: () => this.createSchema.execute() },
      { name: 'migrateSchema', execute: () => this.migrateSchema.execute() },
      {
        name: 'syncPermissions',
        execute: () => this.syncPermissions.execute(),
      },
      { name: 'seedProfiles', execute: () => this.seedProfiles.execute() },
      {
        name: 'bootstrapTenant',
        execute: () => this.bootstrapTenant.execute(command.bootstrap),
      },
      {
        name: 'validateTenant',
        execute: () =>
          this.validateTenant?.execute(command.bootstrap) ??
          Promise.resolve(undefined),
      },
      {
        name: 'activateTenant',
        execute: async () => {
          await this.activateTenant?.execute(command.bootstrap);
          await this.outboxRepository?.activateAndEnqueue({
            provisioningRunId: command.bootstrap.provisioningRunId,
            tenantRegistryId: command.tenantId,
            recipient: command.bootstrap.ownerEmail,
            templateKey: 'tenant-active',
            payload: {
              ownerName: command.bootstrap.ownerName,
              tenantName: command.bootstrap.farmName,
            },
            activatedAt: new Date(this.now()),
          });
        },
      },
    ];
  }

  private requireRunRepository(): ProvisioningRunRepository {
    if (!this.runRepository) {
      throw new TypeError('missingProvisioningRunRepository');
    }
    return this.runRepository;
  }
}

const isRunRepository = (
  value: ProvisioningRunRepository | ProvisioningStage,
): value is ProvisioningRunRepository =>
  'createOrLoadByIdempotencyKey' in value && 'beginStep' in value;

const requireStage = (
  value: ProvisioningStage | (() => string) | (() => number) | undefined,
): ProvisioningStage => {
  if (typeof value === 'object' && value !== null && 'execute' in value) {
    return value;
  }
  throw new TypeError('missingProvisioningStage');
};
