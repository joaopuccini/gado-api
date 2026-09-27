export interface DashboardAnimal {
  readonly id: number;
  readonly batchId: number;
  readonly batchName: string;
  readonly pastureId: number;
  readonly pastureName: string;
  readonly currentWeight: number | null;
}

export interface DashboardMeasurement {
  readonly id: number;
  readonly animalId: number;
  readonly weight: number;
  readonly measuredAt: Date;
}

export interface DashboardSnapshot {
  readonly animals: readonly DashboardAnimal[];
  readonly measurements: readonly DashboardMeasurement[];
}

export interface DashboardRepository {
  load(farmId: number): Promise<DashboardSnapshot>;
}

export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');
