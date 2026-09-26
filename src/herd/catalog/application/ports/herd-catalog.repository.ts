export interface PageRequest {
  readonly page: number;
  readonly limit: number;
}

export interface Page<T> extends PageRequest {
  readonly data: readonly T[];
  readonly total: number;
}

export interface BreedView {
  readonly id: number;
  readonly description: string;
  readonly active: boolean;
}

export interface BatchView extends BreedView {
  readonly farmId: number;
}

export interface CreateBatchRecord {
  readonly farmId: number;
  readonly description: string;
}

export interface UpdateDescriptionRecord {
  readonly description: string;
}

export interface HerdCatalogRepository {
  listBreeds(request: PageRequest): Promise<Page<BreedView>>;
  findBreed(id: number): Promise<BreedView | null>;
  createBreed(description: string): Promise<BreedView>;
  updateBreed(id: number, input: UpdateDescriptionRecord): Promise<BreedView>;
  hasActiveAnimalsForBreed(id: number): Promise<boolean>;
  deactivateBreed(id: number): Promise<BreedView>;
  listBatches(farmId: number, request: PageRequest): Promise<Page<BatchView>>;
  findBatch(id: number, farmId: number): Promise<BatchView | null>;
  createBatch(input: CreateBatchRecord): Promise<BatchView>;
  updateBatch(
    id: number,
    farmId: number,
    input: UpdateDescriptionRecord,
  ): Promise<BatchView>;
  hasActiveAnimalsForBatch(id: number, farmId: number): Promise<boolean>;
  deactivateBatch(id: number, farmId: number): Promise<BatchView>;
}

export const HERD_CATALOG_REPOSITORY = Symbol('HERD_CATALOG_REPOSITORY');
