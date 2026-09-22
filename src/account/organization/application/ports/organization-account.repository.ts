export interface OrganizationAccountRecord {
  readonly organizationId: string;
  readonly name: string;
  readonly legalName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly status: 'trial' | 'active' | 'suspended' | 'canceled';
}

export interface OrganizationAccountRepository {
  findById(organizationId: string): Promise<OrganizationAccountRecord | null>;
}

export const ORGANIZATION_ACCOUNT_REPOSITORY = Symbol(
  'ORGANIZATION_ACCOUNT_REPOSITORY',
);
