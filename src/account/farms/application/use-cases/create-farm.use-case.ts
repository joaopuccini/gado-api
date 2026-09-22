import { ExecutionContextStore } from '../../../../common/context';
import type { FarmRepository, FarmView } from '../ports/farm.repository';

export interface CreateFarmCommand {
  readonly name: string;
  readonly parentId: number | null;
}

export class CreateFarmUseCase {
  constructor(
    private readonly farms: FarmRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  execute(command: CreateFarmCommand): Promise<FarmView> {
    const { localUserId } = this.context.requireTenant();
    return this.farms.create({
      name: command.name,
      parentId: command.parentId,
      ownerLocalUserId: localUserId,
    });
  }
}
