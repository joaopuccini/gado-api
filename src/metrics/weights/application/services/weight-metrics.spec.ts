import {
  calculateAnimalDailyGain,
  calculateAverageDailyGain,
  type WeightMetricPoint,
} from './weight-metrics';

const point = (
  id: string,
  animalId: string,
  weight: number,
  measuredAt: string,
): WeightMetricPoint => ({
  id,
  animalId,
  weight,
  measuredAt: new Date(measuredAt),
});

describe('weight metrics', () => {
  it.each([
    { measurements: [] },
    {
      measurements: [
        point('w1', 'a1', 400, '2026-09-01T00:00:00.000Z'),
      ],
    },
  ])(
    'returns null without a positive interval: %o',
    ({ measurements }) => {
      expect(calculateAnimalDailyGain(measurements)).toBeNull();
    },
  );

  it('sorts measurements and calculates gain from the first to the last', () => {
    expect(
      calculateAnimalDailyGain([
        point('w3', 'a1', 440, '2026-09-21T00:00:00.000Z'),
        point('w1', 'a1', 400, '2026-09-01T00:00:00.000Z'),
        point('w2', 'a1', 420, '2026-09-11T00:00:00.000Z'),
      ]),
    ).toBe(2);
  });

  it('returns null when the first and last measurement are on the same date', () => {
    expect(
      calculateAnimalDailyGain([
        point('w1', 'a1', 400, '2026-09-01T00:00:00.000Z'),
        point('w2', 'a1', 410, '2026-09-01T00:00:00.000Z'),
      ]),
    ).toBeNull();
  });

  it('preserves weight loss as a negative daily gain', () => {
    expect(
      calculateAnimalDailyGain([
        point('w1', 'a1', 450, '2026-09-01T00:00:00.000Z'),
        point('w2', 'a1', 435, '2026-09-11T00:00:00.000Z'),
      ]),
    ).toBe(-1.5);
  });

  it('rounds daily gain to three decimal places', () => {
    expect(
      calculateAnimalDailyGain([
        point('w1', 'a1', 400, '2026-09-01T00:00:00.000Z'),
        point('w2', 'a1', 401, '2026-09-04T00:00:00.000Z'),
      ]),
    ).toBe(0.333);
  });

  it('uses the id as a deterministic tie-breaker for measurements on the same date', () => {
    expect(
      calculateAnimalDailyGain([
        point('w2', 'a1', 405, '2026-09-01T00:00:00.000Z'),
        point('w1', 'a1', 400, '2026-09-01T00:00:00.000Z'),
        point('w3', 'a1', 420, '2026-09-11T00:00:00.000Z'),
      ]),
    ).toBe(1.5);
  });

  it('averages only animals with a valid interval and rounds once at the aggregate', () => {
    expect(
      calculateAverageDailyGain([
        point('a1-w1', 'a1', 400, '2026-09-01T00:00:00.000Z'),
        point('a1-w2', 'a1', 401, '2026-09-04T00:00:00.000Z'),
        point('a2-w1', 'a2', 500, '2026-09-01T00:00:00.000Z'),
        point('a2-w2', 'a2', 502, '2026-09-04T00:00:00.000Z'),
        point('a3-w1', 'a3', 300, '2026-09-01T00:00:00.000Z'),
      ]),
    ).toBe(0.5);
  });

  it('returns null when no animal has a valid daily gain', () => {
    expect(
      calculateAverageDailyGain([
        point('a1-w1', 'a1', 400, '2026-09-01T00:00:00.000Z'),
      ]),
    ).toBeNull();
  });
});
