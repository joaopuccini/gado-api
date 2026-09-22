import { ExecutionContextStore } from '../../../../common/context';
import type { FarmRepository, FarmView } from '../ports/farm.repository';

export class ListFarmsUseCase {
  constructor(
    private readonly farms: FarmRepository,
    private readonly context: ExecutionContextStore,
  ) {}

  execute(): Promise<readonly FarmView[]> {
    const { accessibleFarmIds } = this.context.requireTenant();
    return this.farms.listAccessible(accessibleFarmIds);
  }
}
