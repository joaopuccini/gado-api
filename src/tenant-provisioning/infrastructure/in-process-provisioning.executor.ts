import type { StructuredLogger } from '../../common/logger/structured-logger.service';
import type { ProvisioningExecutor } from '../application/ports/provisioning-executor';
import type { ProvisionTenantOrchestratorCommand } from '../application/use-cases/provision-tenant-orchestrator.use-case';
import type { ProvisionTenantOrchestratorUseCase } from '../application/use-cases/provision-tenant-orchestrator.use-case';

export class InProcessProvisioningExecutor implements ProvisioningExecutor {
  constructor(
    private readonly orchestrator: ProvisionTenantOrchestratorUseCase,
    private readonly logger: StructuredLogger,
  ) {}

  enqueue(command: ProvisionTenantOrchestratorCommand): void {
    queueMicrotask(() => {
      void this.orchestrator.execute(command).catch(() => {
        this.logger.warn('tenantProvisioningFailed', {
          module: 'tenantProvisioning',
          operation: 'executeOnboarding',
          tenantId: command.tenantId,
          organizationId: command.organizationId,
          provisioningRunId: command.bootstrap.provisioningRunId,
          errorCode: 'provisioningStageFailed',
        });
      });
    });
  }
}
