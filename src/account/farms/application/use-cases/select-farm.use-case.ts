import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import { TenantSchemaName } from '../../../../tenant/domain/tenant-schema-name';
import type { FarmRepository } from '../ports/farm.repository';
import type {
  FarmAccessRepository,
  FarmSessionIssuer,
  IssuedFarmSession,
} from '../ports/farm-session.ports';

export interface SelectFarmCommand {
  readonly farmId: number;
}

export class SelectFarmUseCase {
  constructor(
    private readonly farms: FarmRepository,
    private readonly accesses: FarmAccessRepository,
    private readonly sessions: FarmSessionIssuer,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(command: SelectFarmCommand): Promise<IssuedFarmSession> {
    const tenant = this.context.requireTenant();
    if (!tenant.accessibleFarmIds.includes(command.farmId)) {
      this.rejectAccess();
    }

    const farm = await this.farms.findAccessible(
      command.farmId,
      tenant.accessibleFarmIds,
    );
    if (!farm) {
      throw new DomainError('farmNotFound', 'Fazenda não encontrada');
    }
    if (!farm.active) {
      throw new DomainError('farmInactive', 'Fazenda inativa');
    }

    const access = await this.accesses.findActiveAccess(
      tenant.localUserId,
      command.farmId,
    );
    if (!access) this.rejectAccess();

    return this.sessions.sign({
      globalUserId: tenant.globalUserId,
      tenantId: tenant.tenantId,
      organizationId: tenant.organizationId,
      schemaName: TenantSchemaName.parse(tenant.schemaName),
      localUserId: tenant.localUserId,
      farmId: access.farmId,
      role: access.role,
      permissions: access.permissions,
    });
  }

  private rejectAccess(): never {
    throw new DomainError(
      'farmAccessDenied',
      'Acesso à fazenda não autorizado',
    );
  }
}
