export interface OperationalIdentity {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string | null;
}

export interface OperationalAccess {
  readonly organizationId: string;
  readonly tenantId: string;
  readonly schemaName: string;
  readonly localUserId: number;
  readonly farmId: number;
  readonly farmName: string;
  readonly accessibleFarmIds: readonly number[];
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface OperationalIdentityRepository {
  findActiveByEmail(email: string): Promise<OperationalIdentity | null>;
}

export interface OperationalAccessRepository {
  listActiveByGlobalUser(
    globalUserId: string,
  ): Promise<readonly OperationalAccess[]>;
}

export interface PasswordVerifier {
  compare(plainText: string, passwordHash: string): Promise<boolean>;
}

export interface TenantTokenClaims {
  readonly aud: 'gado-tenant';
  readonly sub: string;
  readonly email: string;
  readonly organizationId: string;
  readonly tenantId: string;
  readonly schemaName: string;
  readonly localUserId: number;
  readonly farmId: number;
  readonly accessibleFarmIds: readonly number[];
  readonly role: string;
  readonly permissions: readonly string[];
}

export interface IssuedAccessToken {
  readonly accessToken: string;
  readonly expiresIn: number;
}

export interface TenantTokenIssuer {
  sign(claims: TenantTokenClaims): Promise<IssuedAccessToken>;
}
