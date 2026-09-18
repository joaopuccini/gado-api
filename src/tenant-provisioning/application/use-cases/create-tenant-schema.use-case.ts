import { ExecutionContextStore } from '../../../common/context';
import { TenantSchemaName } from '../../../tenant/domain/tenant-schema-name';
import type { TenantSchemaLifecycleRepository } from '../ports/tenant-schema-lifecycle.repository';

export class CreateTenantSchemaUseCase {
  constructor(
    private readonly context: ExecutionContextStore,
    private readonly repository: TenantSchemaLifecycleRepository,
  ) {}

  async execute(): Promise<void> {
    const { schemaName } = this.context.requireTenantIdentity();
    await this.repository.ensureExists(TenantSchemaName.parse(schemaName));
  }
}
