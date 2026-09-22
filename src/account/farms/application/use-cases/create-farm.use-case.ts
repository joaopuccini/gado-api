import { ExecutionContextStore } from '../../../../common/context';
import { FarmHierarchyPolicy } from '../../domain/farm-hierarchy.policy';
import type { FarmRepository, FarmView } from '../ports/farm.repository';

export interface CreateFarmCommand {
  readonly name: string;
  readonly parentId: number | null;
}

export class CreateFarmUseCase {
  constructor(
    private readonly farms: FarmRepository,
    private readonly hierarchy: FarmHierarchyPolicy,
    private readonly context: ExecutionContextStore,
  ) {}

  async execute(command: CreateFarmCommand): Promise<FarmView> {
    const { localUserId } = this.context.requireTenant();
    if (command.parentId !== null) {
      this.hierarchy.assertValidParent({
        farmId: undefined,
        parentId: command.parentId,
        farms: await this.farms.listHierarchy(),
      });
    }
    return this.farms.create({
      name: command.name,
      parentId: command.parentId,
      ownerLocalUserId: localUserId,
    });
  }
}
