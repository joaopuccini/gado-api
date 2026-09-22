import type { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type { OrganizationAccountRepository } from '../ports/organization-account.repository';

export interface OrganizationAccountView {
  readonly name: string;
  readonly legalName: string;
  readonly contact: {
    readonly email: string;
    readonly phone: string | null;
  };
  readonly status: 'trial' | 'active' | 'suspended' | 'canceled';
}

export class GetOrganizationAccountUseCase {
  constructor(
    private readonly organizations: OrganizationAccountRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(): Promise<OrganizationAccountView> {
    const { organizationId } = this.context.requireTenantIdentity();
    const organization = await this.organizations.findById(organizationId);
    if (!organization || organization.organizationId !== organizationId) {
      throw new DomainError(
        'organizationUnavailable',
        'Organização indisponível',
      );
    }
    return {
      name: organization.name,
      legalName: organization.legalName,
      contact: { email: organization.email, phone: organization.phone },
      status: organization.status,
    };
  }
}
