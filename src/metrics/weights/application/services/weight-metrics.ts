export interface WeightMetricPoint {
  id: string;
  animalId: string;
  weight: number;
  measuredAt: Date;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const roundThree = (value: number): number =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

const comparePoints = (left: WeightMetricPoint, right: WeightMetricPoint) => {
  const byDate = left.measuredAt.getTime() - right.measuredAt.getTime();
  return byDate === 0 ? left.id.localeCompare(right.id) : byDate;
};

const latestPointPerTimestamp = (
  measurements: readonly WeightMetricPoint[],
): WeightMetricPoint[] => {
  const byTimestamp = new Map<number, WeightMetricPoint>();

  for (const measurement of [...measurements].sort(comparePoints)) {
    byTimestamp.set(measurement.measuredAt.getTime(), measurement);
  }

  return [...byTimestamp.values()].sort(comparePoints);
};

export const calculateAnimalDailyGain = (
  measurements: readonly WeightMetricPoint[],
): number | null => {
  const ordered = latestPointPerTimestamp(measurements);
  if (ordered.length < 2) {
    return null;
  }

  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const elapsedDays =
    (last.measuredAt.getTime() - first.measuredAt.getTime()) /
    MILLISECONDS_PER_DAY;

  if (elapsedDays <= 0) {
    return null;
  }

  return roundThree((last.weight - first.weight) / elapsedDays);
};

export const calculateAverageDailyGain = (
  measurements: readonly WeightMetricPoint[],
): number | null => {
  const byAnimal = new Map<string, WeightMetricPoint[]>();

  for (const measurement of measurements) {
    const animalMeasurements = byAnimal.get(measurement.animalId) ?? [];
    animalMeasurements.push(measurement);
    byAnimal.set(measurement.animalId, animalMeasurements);
  }

  const validGains = [...byAnimal.values()]
    .map(calculateAnimalDailyGain)
    .filter((gain): gain is number => gain !== null);

  if (validGains.length === 0) {
    return null;
  }

  return roundThree(
    validGains.reduce((total, gain) => total + gain, 0) / validGains.length,
  );
};
