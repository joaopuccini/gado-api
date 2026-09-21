export const ADMIN_IDENTITY_REPOSITORY = Symbol('ADMIN_IDENTITY_REPOSITORY');
export const ADMIN_PASSWORD_VERIFIER = Symbol('ADMIN_PASSWORD_VERIFIER');
export const ADMIN_TOKEN_ISSUER = Symbol('ADMIN_TOKEN_ISSUER');

export interface AdminIdentity {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: string;
  readonly active: boolean;
}

export interface AdminIdentityRepository {
  findByEmail(email: string): Promise<AdminIdentity | null>;
}

export interface AdminPasswordVerifier {
  compare(plainText: string, passwordHash: string): Promise<boolean>;
}

export interface AdminTokenClaims {
  readonly sub: string;
  readonly email: string;
  readonly role: string;
  readonly aud: 'gado-admin';
}

export interface AdminTokenIssuer {
  sign(claims: AdminTokenClaims): Promise<string>;
}
