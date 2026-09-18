import { randomUUID } from 'node:crypto';
import { ExecutionContextStore } from '../../../common/context';
import { TenantSchemaName } from '../../../tenant/domain/tenant-schema-name';
import type { TenantBootstrapCommand } from '../ports/tenant-bootstrap.repository';

interface ProvisioningStage {
  execute(command?: TenantBootstrapCommand): Promise<unknown>;
}

export interface ProvisionTenantOrchestratorCommand {
  readonly tenantId: string;
  readonly organizationId: string;
  readonly schemaName: string;
  readonly globalUserId: string;
  readonly bootstrap: TenantBootstrapCommand;
}

export class ProvisionTenantOrchestratorUseCase {
  constructor(
    private readonly context: ExecutionContextStore,
    private readonly createSchema: ProvisioningStage,
    private readonly migrateSchema: ProvisioningStage,
    private readonly syncPermissions: ProvisioningStage,
    private readonly seedProfiles: ProvisioningStage,
    private readonly provisionTenant: ProvisioningStage,
    private readonly requestIdFactory: () => string = randomUUID,
    private readonly now: () => number = Date.now,
  ) {}

  async execute(command: ProvisionTenantOrchestratorCommand): Promise<void> {
    const schemaName = TenantSchemaName.parse(command.schemaName).value;
    const requestId = this.requestIdFactory();

    await this.context.run(
      {
        requestId,
        traceId: requestId,
        contextType: 'job',
        startedAt: this.now(),
        tenantId: command.tenantId,
        organizationId: command.organizationId,
        schemaName,
        globalUserId: command.globalUserId,
        accessibleFarmIds: [],
        permissions: ['tenant.provision'],
      },
      async () => {
        await this.createSchema.execute();
        await this.migrateSchema.execute();
        await this.syncPermissions.execute();
        await this.seedProfiles.execute();
        await this.provisionTenant.execute(command.bootstrap);
      },
    );
  }
}
