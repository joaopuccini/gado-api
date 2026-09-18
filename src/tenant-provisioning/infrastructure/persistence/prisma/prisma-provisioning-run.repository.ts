import { ProvisioningState } from '@prisma/client-admin';
import { AdminPrismaService } from '../../../../admin/admin-prisma.service';
import type {
  CreateOrLoadProvisioningRunCommand,
  PersistedProvisioningState,
  ProvisioningResourceCounts,
  ProvisioningRunRepository,
  ProvisioningRunSnapshot,
  ProvisioningStageName,
  ProvisioningStepFailure,
} from '../../../application/ports/provisioning-run.repository';

const stages: readonly ProvisioningStageName[] = [
  'createSchema',
  'migrateSchema',
  'syncPermissions',
  'seedProfiles',
  'bootstrapTenant',
  'validateTenant',
  'activateTenant',
];

const stateByStage: Readonly<Record<ProvisioningStageName, ProvisioningState>> =
  {
    createSchema: ProvisioningState.PROVISIONING_SCHEMA,
    migrateSchema: ProvisioningState.APPLYING_MIGRATIONS,
    syncPermissions: ProvisioningState.SEEDING,
    seedProfiles: ProvisioningState.SEEDING,
    bootstrapTenant: ProvisioningState.SEEDING,
    validateTenant: ProvisioningState.VALIDATING,
    activateTenant: ProvisioningState.ACTIVE,
  };

const stageAttemptBase = (stage: ProvisioningStageName): number =>
  (stages.indexOf(stage) + 1) * 1000;

export class PrismaProvisioningRunRepository implements ProvisioningRunRepository {
  constructor(private readonly database: AdminPrismaService) {}

  async createOrLoadByIdempotencyKey(
    command: CreateOrLoadProvisioningRunCommand,
  ): Promise<ProvisioningRunSnapshot> {
    const run = await this.database.provisioningRun.upsert({
      where: { idempotencyKey: command.idempotencyKey },
      create: {
        id: command.provisioningRunId,
        idempotencyKey: command.idempotencyKey,
        tenantRegistryId: command.tenantRegistryId,
        state: 'REGISTERED',
      },
      update: {},
      select: { id: true, tenantRegistryId: true, state: true },
    });

    return {
      provisioningRunId: run.id,
      tenantRegistryId: run.tenantRegistryId,
      state: run.state,
    };
  }

  async loadPersistedState(runId: string): Promise<PersistedProvisioningState> {
    const completed = await this.database.provisioningStep.findMany({
      where: {
        runId,
        status: 'SUCCEEDED',
        errorMessage: { in: [...stages] },
      },
      select: { errorMessage: true },
    });
    const completedStages = new Set(completed.map((step) => step.errorMessage));
    const nextStage =
      stages.find((stage) => !completedStages.has(stage)) ?? 'activateTenant';

    return { nextStage };
  }

  async beginStep(
    runId: string,
    stage: ProvisioningStageName,
  ): Promise<boolean> {
    const completed = await this.database.provisioningStep.findFirst({
      where: { runId, status: 'SUCCEEDED', errorMessage: stage },
      select: { id: true },
    });
    if (completed) return false;

    const latest = await this.database.provisioningStep.findFirst({
      where: { runId, errorMessage: stage },
      orderBy: { attempt: 'desc' },
      select: { attempt: true },
    });
    const base = stageAttemptBase(stage);
    const attempt = latest ? latest.attempt + 1 : base + 1;

    await this.database.provisioningStep.create({
      data: {
        runId,
        state: stateByStage[stage],
        status: 'RUNNING',
        attempt,
        startedAt: new Date(),
        errorMessage: stage,
      },
    });

    return true;
  }

  async completeStep(
    runId: string,
    stage: ProvisioningStageName,
  ): Promise<void> {
    await this.database.provisioningStep.updateMany({
      where: { runId, status: 'RUNNING', errorMessage: stage },
      data: {
        status: 'SUCCEEDED',
        completedAt: new Date(),
        errorCode: null,
      },
    });
  }

  async failStep(
    runId: string,
    stage: ProvisioningStageName,
    failure: ProvisioningStepFailure,
  ): Promise<void> {
    await this.database.provisioningStep.updateMany({
      where: { runId, status: 'RUNNING', errorMessage: stage },
      data: {
        status: 'FAILED',
        errorCode: failure.errorCode,
      },
    });
  }

  async completeRun(runId: string): Promise<void> {
    await this.database.provisioningRun.update({
      where: { id: runId },
      data: { state: 'ACTIVE', completedAt: new Date() },
    });
  }

  async snapshotCounts(runId: string): Promise<ProvisioningResourceCounts> {
    const outboxEvents = await this.database.onboardingOutbox.count({
      where: { provisioningRunId: runId },
    });

    return {
      permissions: 0,
      systemProfiles: 0,
      owners: 0,
      farms: 0,
      ownerFarmLinks: 0,
      outboxEvents,
    };
  }
}
