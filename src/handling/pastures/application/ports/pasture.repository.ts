import type { GeoJsonPolygon } from '../../domain/pasture';

export interface PageRequest {
  readonly page: number;
  readonly limit: number;
}

export interface Page<T> extends PageRequest {
  readonly data: readonly T[];
  readonly total: number;
}

export interface PastureView {
  readonly id: number;
  readonly farmId: number;
  readonly description: string;
  readonly geoJson: GeoJsonPolygon;
  readonly areaHectares?: string;
  readonly active: boolean;
}

export interface CreatePastureRecord {
  readonly farmId: number;
  readonly description: string;
  readonly geoJson: GeoJsonPolygon;
  readonly areaHectares?: string;
}

export type UpdatePastureRecord = Omit<CreatePastureRecord, 'farmId'>;

export interface PastureRepository {
  list(farmId: number, request: PageRequest): Promise<Page<PastureView>>;
  findById(id: number, farmId: number): Promise<PastureView | null>;
  create(input: CreatePastureRecord): Promise<PastureView>;
  update(
    id: number,
    farmId: number,
    input: UpdatePastureRecord,
  ): Promise<PastureView>;
  hasActiveAnimals(id: number, farmId: number): Promise<boolean>;
  hasMovementHistory(id: number, farmId: number): Promise<boolean>;
  deactivate(id: number, farmId: number): Promise<PastureView>;
}

export const PASTURE_REPOSITORY = Symbol('PASTURE_REPOSITORY');
