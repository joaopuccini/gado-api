export interface FarmView {
  readonly id: number;
  readonly name: string;
  readonly parentId: number | null;
  readonly active: boolean;
}

export interface CreateFarmRecord {
  readonly name: string;
  readonly parentId: number | null;
  readonly ownerLocalUserId: number;
}

export interface UpdateFarmRecord {
  readonly name?: string;
  readonly parentId?: number | null;
}

export interface FarmRepository {
  listHierarchy(): Promise<readonly FarmHierarchyNode[]>;
  listAccessible(farmIds: readonly number[]): Promise<readonly FarmView[]>;
  findAccessible(
    id: number,
    farmIds: readonly number[],
  ): Promise<FarmView | null>;
  create(input: CreateFarmRecord): Promise<FarmView>;
  update(id: number, input: UpdateFarmRecord): Promise<FarmView>;
  deactivate(id: number): Promise<FarmView>;
}

export const FARM_REPOSITORY = Symbol('FARM_REPOSITORY');
import type { FarmHierarchyNode } from '../../domain/farm-hierarchy.policy';
