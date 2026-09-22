import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import type { FarmRepository, FarmView } from '../ports/farm.repository';

export interface DeactivateFarmCommand {
  readonly farmId: number;
}

export class DeactivateFarmUseCase {
  constructor(
    private readonly farms: FarmRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(command: DeactivateFarmCommand): Promise<FarmView> {
    const tenant = this.context.requireTenant();
    if (!tenant.accessibleFarmIds.includes(command.farmId)) {
      throw new DomainError(
        'farmAccessDenied',
        'Acesso à fazenda não autorizado',
      );
    }
    if (tenant.farmId === command.farmId) {
      throw new DomainError(
        'farmSelectedCannotDeactivate',
        'A fazenda selecionada não pode ser desativada',
      );
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

    return this.farms.deactivate(command.farmId);
  }
}
