import { DomainError } from '../../../common/errors/domain-error';
import type {
  TenantBootstrapCommand,
  TenantBootstrapRepository,
  TenantBootstrapResources,
} from '../ports/tenant-bootstrap.repository';

export class ProvisionTenantUseCase {
  constructor(private readonly repository: TenantBootstrapRepository) {}

  async execute(
    command: TenantBootstrapCommand,
  ): Promise<TenantBootstrapResources> {
    const resources = await this.repository.bootstrap(command);
    if (!(await this.repository.smokeCheck(resources))) {
      throw new DomainError(
        'tenantSmokeCheckFailed',
        'Validação final do tenant falhou',
      );
    }
    return resources;
  }
}
