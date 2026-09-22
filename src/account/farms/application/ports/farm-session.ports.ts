export interface VerifiedFarmAccess {
  readonly farmId: number;
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface FarmAccessRepository {
  findActiveAccess(
    localUserId: number,
    farmId: number,
  ): Promise<VerifiedFarmAccess | null>;
}

export interface FarmSessionClaims {
  readonly globalUserId: string;
  readonly tenantId: string;
  readonly organizationId: string;
  readonly schemaName: TenantSchemaName;
  readonly localUserId: number;
  readonly farmId: number;
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface IssuedFarmSession {
  readonly accessToken: string;
  readonly expiresIn: number;
}

export interface FarmSessionIssuer {
  sign(input: FarmSessionClaims): Promise<IssuedFarmSession>;
}

export const FARM_ACCESS_REPOSITORY = Symbol('FARM_ACCESS_REPOSITORY');
export const FARM_SESSION_ISSUER = Symbol('FARM_SESSION_ISSUER');
import type { TenantSchemaName } from '../../../../tenant/domain/tenant-schema-name';
