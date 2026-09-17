import { randomUUID } from 'node:crypto';
import { ExecutionContextStore } from '../../../common/context';
import { DomainError } from '../../../common/errors/domain-error';
import { TenantSchemaName } from '../../../tenant/domain/tenant-schema-name';
import {
  MigrateTenantSchemaUseCase,
  type TenantMigrationResult,
} from './migrate-tenant-schema.use-case';

export interface ProvisionSchemaCommand {
  readonly tenantId: string;
  readonly organizationId: string;
  readonly schemaName: string;
  readonly initiatedByGlobalUserId: string;
}

export interface ProvisionSchemaResult extends TenantMigrationResult {
  readonly schemaName: string;
}

export class ProvisionSchemaUseCase {
  constructor(
    private readonly context: ExecutionContextStore,
    private readonly migrateTenantSchema: MigrateTenantSchemaUseCase,
    private readonly requestIdFactory: () => string = randomUUID,
    private readonly now: () => number = Date.now,
  ) {}

  async execute(
    command: ProvisionSchemaCommand,
  ): Promise<ProvisionSchemaResult> {
    const schema = TenantSchemaName.parse(command.schemaName);
    this.assertIdentity(command);
    const requestId = this.requestIdFactory();

    return this.context.run(
      {
        requestId,
        traceId: requestId,
        contextType: 'job',
        startedAt: this.now(),
        tenantId: command.tenantId,
        organizationId: command.organizationId,
        schemaName: schema.value,
        globalUserId: command.initiatedByGlobalUserId,
        accessibleFarmIds: [],
        permissions: ['tenant.migrate'],
      },
      async () => ({
        schemaName: schema.value,
        ...(await this.migrateTenantSchema.execute()),
      }),
    );
  }

  private assertIdentity(command: ProvisionSchemaCommand): void {
    if (
      command.tenantId.trim().length === 0 ||
      command.organizationId.trim().length === 0 ||
      command.initiatedByGlobalUserId.trim().length === 0
    ) {
      throw new DomainError(
        'invalidProvisioningRun',
        'Provisionamento exige identidades administrativas válidas',
      );
    }
  }
}
