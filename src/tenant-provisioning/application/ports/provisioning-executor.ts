import type { ProvisionTenantOrchestratorCommand } from '../use-cases/provision-tenant-orchestrator.use-case';

export const PROVISIONING_EXECUTOR = Symbol('PROVISIONING_EXECUTOR');

export interface ProvisioningExecutor {
  enqueue(command: ProvisionTenantOrchestratorCommand): void;
}
