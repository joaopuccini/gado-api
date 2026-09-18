export const TENANT_BOOTSTRAP_REPOSITORY = Symbol(
  'TENANT_BOOTSTRAP_REPOSITORY',
);

export interface TenantBootstrapCommand {
  readonly provisioningRunId: string;
  readonly globalUserId: string;
  readonly ownerName: string;
  readonly ownerEmail: string;
  readonly passwordHash: string;
  readonly farmName: string;
}

export interface TenantBootstrapResources {
  readonly localUserId: number;
  readonly farmId: number;
  readonly userFarmId: number;
}

export interface TenantBootstrapRepository {
  bootstrap(command: TenantBootstrapCommand): Promise<TenantBootstrapResources>;
  smokeCheck(resources: TenantBootstrapResources): Promise<boolean>;
}
