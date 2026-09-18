export const PROVISIONING_RUN_REPOSITORY = Symbol(
  'PROVISIONING_RUN_REPOSITORY',
);

export type ProvisioningStageName =
  | 'createSchema'
  | 'migrateSchema'
  | 'syncPermissions'
  | 'seedProfiles'
  | 'bootstrapTenant'
  | 'validateTenant'
  | 'activateTenant';

export interface ProvisioningRunSnapshot {
  readonly provisioningRunId: string;
  readonly tenantRegistryId: string;
  readonly state: string;
}

export interface CreateOrLoadProvisioningRunCommand {
  readonly idempotencyKey: string;
  readonly provisioningRunId: string;
  readonly tenantRegistryId: string;
}

export interface PersistedProvisioningState {
  readonly nextStage: ProvisioningStageName;
}

export interface ProvisioningStepFailure {
  readonly errorCode: 'provisioningStageFailed';
}

export interface ProvisioningResourceCounts {
  readonly permissions: number;
  readonly systemProfiles: number;
  readonly owners: number;
  readonly farms: number;
  readonly ownerFarmLinks: number;
  readonly outboxEvents: number;
}

export interface ProvisioningRunRepository {
  createOrLoadByIdempotencyKey(
    command: CreateOrLoadProvisioningRunCommand,
  ): Promise<ProvisioningRunSnapshot>;
  loadPersistedState(runId: string): Promise<PersistedProvisioningState>;
  beginStep(runId: string, stage: ProvisioningStageName): Promise<boolean>;
  completeStep(runId: string, stage: ProvisioningStageName): Promise<void>;
  failStep(
    runId: string,
    stage: ProvisioningStageName,
    failure: ProvisioningStepFailure,
  ): Promise<void>;
  completeRun(runId: string): Promise<void>;
  snapshotCounts(runId: string): Promise<ProvisioningResourceCounts>;
}
