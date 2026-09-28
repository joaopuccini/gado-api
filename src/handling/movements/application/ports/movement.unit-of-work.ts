export const MOVEMENT_UNIT_OF_WORK = Symbol('MOVEMENT_UNIT_OF_WORK');

export type MovementKind = 'pasture' | 'batch';

export interface AnimalLocation {
  readonly animalId: number;
  readonly farmId: number;
  readonly pastureId: number;
  readonly batchId: number;
  readonly active: boolean;
}

export interface AtomicMovementRecord {
  readonly kind: MovementKind;
  readonly farmId: number;
  readonly animalId: number;
  readonly originId: number;
  readonly destinationId: number;
  readonly registeredById: number;
  readonly movementDate: string;
  readonly notes?: string | null;
}

export interface AnimalMovementView {
  readonly id: number;
  readonly kind: MovementKind;
  readonly farmId: number;
  readonly animalId: number;
  readonly originId: number;
  readonly destinationId: number;
  readonly registeredById: number | null;
  readonly movementDate: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

export interface MovementHistoryRequest {
  readonly animalId?: number;
  readonly kind?: MovementKind;
  readonly page: number;
  readonly pageSize: number;
}

export interface MovementHistoryPage {
  readonly data: readonly AnimalMovementView[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface MovementUnitOfWork {
  findAnimalLocation(
    animalId: number,
    farmId: number,
  ): Promise<AnimalLocation | null>;
  moveAtomically(input: AtomicMovementRecord): Promise<AnimalMovementView>;
  listHistory(
    farmId: number,
    request: MovementHistoryRequest,
  ): Promise<MovementHistoryPage>;
}
