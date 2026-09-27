import { ExecutionContextStore } from '../../../../common/context';
import { calculateAverageDailyGain } from '../../../weights/application/services/weight-metrics';
import type {
  DashboardAnimal,
  DashboardMeasurement,
  DashboardRepository,
} from '../ports/dashboard.repository';

const DAY = 86_400_000;
const round = (value: number): number => Math.round(value * 1000) / 1000;
const average = (values: readonly number[]): number | null =>
  values.length
    ? round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;

const distributions = (
  animals: readonly DashboardAnimal[],
  kind: 'batch' | 'pasture',
) => {
  const groups = new Map<
    number,
    { id: number; name: string; weights: number[]; animalCount: number }
  >();
  for (const animal of animals) {
    const id = kind === 'batch' ? animal.batchId : animal.pastureId;
    const name = kind === 'batch' ? animal.batchName : animal.pastureName;
    const group = groups.get(id) ?? { id, name, weights: [], animalCount: 0 };
    group.animalCount += 1;
    if (animal.currentWeight !== null) group.weights.push(animal.currentWeight);
    groups.set(id, group);
  }
  return [...groups.values()]
    .sort((left, right) => left.id - right.id)
    .map(({ weights, ...group }) => ({
      ...group,
      averageWeight: average(weights),
    }));
};

export class GetFarmDashboardUseCase {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly context: ExecutionContextStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute() {
    const { farmId } = this.context.requireTenant();
    const snapshot = await this.repository.load(farmId);
    const weights = snapshot.animals.flatMap(({ currentWeight }) =>
      currentWeight === null ? [] : [currentWeight],
    );
    return {
      activeAnimals: snapshot.animals.length,
      averageWeight: average(weights),
      averageDailyGain: calculateAverageDailyGain(
        snapshot.measurements.map((measurement) => ({
          ...measurement,
          animalId: String(measurement.animalId),
        })),
      ),
      monthlyEvolution: this.monthlyEvolution(snapshot.measurements),
      byBatch: distributions(snapshot.animals, 'batch'),
      byPasture: distributions(snapshot.animals, 'pasture'),
      alerts: this.alerts(snapshot.animals, snapshot.measurements),
    };
  }

  private monthlyEvolution(measurements: readonly DashboardMeasurement[]) {
    const months = new Map<string, number[]>();
    for (const measurement of measurements) {
      const month = measurement.measuredAt.toISOString().slice(0, 7);
      months.set(month, [...(months.get(month) ?? []), measurement.weight]);
    }
    return [...months.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, values]) => ({ month, averageWeight: average(values) }));
  }

  private alerts(
    animals: readonly DashboardAnimal[],
    measurements: readonly DashboardMeasurement[],
  ) {
    const now = this.now().getTime();
    return [...animals]
      .sort((left, right) => left.id - right.id)
      .flatMap((animal) => {
        const history = measurements
          .filter(({ animalId }) => animalId === animal.id)
          .sort((left, right) =>
            left.measuredAt.getTime() === right.measuredAt.getTime()
              ? left.id - right.id
              : left.measuredAt.getTime() - right.measuredAt.getTime(),
          );
        if (!history.length) {
          return [
            {
              type: 'NO_WEIGHT' as const,
              animalId: animal.id,
              lastMeasuredAt: null,
            },
          ];
        }
        const last = history[history.length - 1];
        const result: Array<{
          type: 'STALE_WEIGHT' | 'WEIGHT_LOSS';
          animalId: number;
          lastMeasuredAt: string;
        }> = [];
        if ((now - last.measuredAt.getTime()) / DAY > 30) {
          result.push({
            type: 'STALE_WEIGHT',
            animalId: animal.id,
            lastMeasuredAt: last.measuredAt.toISOString().slice(0, 10),
          });
        }
        const previous = history.at(-2);
        if (previous && last.weight < previous.weight) {
          result.push({
            type: 'WEIGHT_LOSS',
            animalId: animal.id,
            lastMeasuredAt: last.measuredAt.toISOString().slice(0, 10),
          });
        }
        return result;
      });
  }
}
