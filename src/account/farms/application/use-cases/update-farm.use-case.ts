import { ExecutionContextStore } from '../../../../common/context';
import { DomainError } from '../../../../common/errors/domain-error';
import { FarmHierarchyPolicy } from '../../domain/farm-hierarchy.policy';
import type {
  FarmRepository,
  FarmView,
  UpdateFarmRecord,
} from '../ports/farm.repository';

export interface UpdateFarmCommand extends UpdateFarmRecord {
  readonly farmId: number;
}

export class UpdateFarmUseCase {
  constructor(
    private readonly farms: FarmRepository,
    private readonly hierarchy: FarmHierarchyPolicy,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(command: UpdateFarmCommand): Promise<FarmView> {
    const { accessibleFarmIds } = this.context.requireTenant();
    if (!accessibleFarmIds.includes(command.farmId)) {
      throw new DomainError(
        'farmAccessDenied',
        'Acesso à fazenda não autorizado',
      );
    }

    const farm = await this.farms.findAccessible(
      command.farmId,
      accessibleFarmIds,
    );
    if (!farm) {
      throw new DomainError('farmNotFound', 'Fazenda não encontrada');
    }
    if (!farm.active) {
      throw new DomainError('farmInactive', 'Fazenda inativa');
    }

    if (command.parentId !== undefined) {
      this.hierarchy.assertValidParent({
        farmId: command.farmId,
        parentId: command.parentId,
        farms: await this.farms.listHierarchy(),
      });
    }

    const { farmId: _farmId, ...input } = command;
    return this.farms.update(command.farmId, input);
  }
}
