export const TENANT_REGISTRY_REPOSITORY = Symbol('TENANT_REGISTRY_REPOSITORY');

export type TenantRegistryStatus =
  | 'active'
  | 'blocked'
  | 'removed'
  | 'provisioning';

export interface TenantRegistryRecord {
  tenantId: string;
  organizationId: string;
  schemaName: string;
  subdomain: string;
  status: TenantRegistryStatus;
}

export interface TenantFarmMembership {
  farmId: number;
  parentId: number | null;
  active: boolean;
  role: string;
  permissions: readonly string[];
}

export interface TenantMembershipRecord {
  localUserId: number;
  farms: readonly TenantFarmMembership[];
}

export interface TenantRegistryRepository {
  findById(tenantId: string): Promise<TenantRegistryRecord | null>;
  findMembership(
    tenant: TenantRegistryRecord,
    globalUserId: string,
  ): Promise<TenantMembershipRecord | null>;
}
