import { DomainError } from '../../../common/errors/domain-error';

export interface FarmHierarchyNode {
  readonly id: number;
  readonly parentId: number | null;
  readonly active: boolean;
}

export interface ResolveFarmAccessInput {
  readonly selectedFarmId: number;
  readonly selectedRole: string;
  readonly membershipFarmIds: readonly number[];
  readonly farms: readonly FarmHierarchyNode[];
}

export interface ValidateFarmParentInput {
  readonly farmId: number | undefined;
  readonly parentId: number | null;
  readonly farms: readonly FarmHierarchyNode[];
}

export class FarmHierarchyPolicy {
  resolveAccessibleFarmIds(input: ResolveFarmAccessInput): readonly number[] {
    if (!input.membershipFarmIds.includes(input.selectedFarmId)) {
      throw new DomainError(
        'farmAccessDenied',
        'Acesso à fazenda não autorizado',
      );
    }

    const selected = input.farms.find(
      (farm) => farm.id === input.selectedFarmId,
    );
    if (!selected) {
      throw new DomainError('farmNotFound', 'Fazenda não encontrada');
    }
    if (!selected.active) {
      throw new DomainError('farmInactive', 'Fazenda inativa');
    }

    const canExpandRoot =
      selected.parentId === null &&
      ['DONO', 'GESTOR'].includes(input.selectedRole);
    if (!canExpandRoot) return Object.freeze([selected.id]);

    const linked = new Set(input.membershipFarmIds);
    return Object.freeze([
      selected.id,
      ...input.farms
        .filter(
          (farm) =>
            farm.parentId === selected.id && farm.active && linked.has(farm.id),
        )
        .map((farm) => farm.id),
    ]);
  }

  assertValidParent(input: ValidateFarmParentInput): void {
    if (input.parentId === null) return;
    if (input.farmId !== undefined && input.farmId === input.parentId) {
      this.rejectHierarchy();
    }

    const parent = input.farms.find((farm) => farm.id === input.parentId);
    if (!parent?.active || parent.parentId !== null) {
      this.rejectHierarchy();
    }

    if (
      input.farmId !== undefined &&
      input.farms.some(
        (farm) => farm.id === input.parentId && farm.parentId === input.farmId,
      )
    ) {
      this.rejectHierarchy();
    }
  }

  private rejectHierarchy(): never {
    throw new DomainError(
      'invalidFarmHierarchy',
      'Hierarquia de fazendas inválida',
    );
  }
}
