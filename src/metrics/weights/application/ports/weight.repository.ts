export interface AnimalWeightScope {
  readonly id: number;
  readonly farmId: number;
  readonly entryDate: Date;
  readonly active: boolean;
}

export interface WeightMeasurementView {
  readonly id: number;
  readonly farmId: number;
  readonly animalId: number;
  readonly weight: number;
  readonly measuredAt: string;
  readonly note: string | null;
  readonly active: boolean;
  readonly correctsMeasurementId: number | null;
  readonly correctionReason: string | null;
  readonly registeredById: number;
  readonly createdAt: string;
}

export interface WeightMeasurementPage {
  readonly data: readonly WeightMeasurementView[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface WeightListInput {
  readonly animalId?: number;
  readonly page: number;
  readonly limit: number;
}

export interface CreateWeightRecord {
  readonly farmId: number;
  readonly animalId: number;
  readonly registeredById: number;
  readonly weight: number;
  readonly measuredAt: Date;
  readonly note: string | null;
}

export interface CorrectWeightRecord extends CreateWeightRecord {
  readonly previousMeasurementId: number;
  readonly correctionReason: string;
}

export interface WeightRepository {
  list(
    farmId: number,
    input: WeightListInput,
  ): Promise<WeightMeasurementPage>;
  find(id: number, farmId: number): Promise<WeightMeasurementView | null>;
  findAnimal(
    animalId: number,
    farmId: number,
  ): Promise<AnimalWeightScope | null>;
  create(input: CreateWeightRecord): Promise<WeightMeasurementView>;
  correct(input: CorrectWeightRecord): Promise<WeightMeasurementView>;
}

export const WEIGHT_REPOSITORY = Symbol('WEIGHT_REPOSITORY');
