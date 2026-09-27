import { DomainError } from '../../../common/errors/domain-error';
import {
  normalizeWeightCorrection,
  normalizeWeightMeasurement,
} from './weight-measurement';

const today = new Date('2026-09-27T12:00:00.000Z');
const animalEntryDate = new Date('2026-01-10T00:00:00.000Z');

const expectDomainError = (
  action: () => unknown,
  expected: Partial<DomainError>,
): void => {
  try {
    action();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject(expected);
    return;
  }
  throw new Error('Expected a DomainError');
};

describe('weight measurement domain', () => {
  it.each([0, -1, 3000.001, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid weight %s',
    (weight) => {
      expectDomainError(
        () =>
          normalizeWeightMeasurement({
            weight,
            measuredAt: new Date('2026-09-20T00:00:00.000Z'),
            animalEntryDate,
            today,
          }),
        {
          code: 'validationFailed',
          details: [{ field: 'weight', reason: 'outOfRange' }],
        },
      );
    },
  );

  it.each([0.001, 3000])('accepts boundary weight %s', (weight) => {
    expect(
      normalizeWeightMeasurement({
        weight,
        measuredAt: new Date('2026-09-20T00:00:00.000Z'),
        animalEntryDate,
        today,
      }).weight,
    ).toBe(weight);
  });

  it('rejects a future measurement date', () => {
    expectDomainError(
      () =>
        normalizeWeightMeasurement({
          weight: 450,
          measuredAt: new Date('2026-09-28T00:00:00.000Z'),
          animalEntryDate,
          today,
        }),
      {
        code: 'validationFailed',
        details: [{ field: 'measuredAt', reason: 'futureDate' }],
      },
    );
  });

  it('rejects a measurement before the animal entry date', () => {
    expectDomainError(
      () =>
        normalizeWeightMeasurement({
          weight: 450,
          measuredAt: new Date('2026-01-09T23:59:59.999Z'),
          animalEntryDate,
          today,
        }),
      {
        code: 'validationFailed',
        details: [{ field: 'measuredAt', reason: 'beforeAnimalEntry' }],
      },
    );
  });

  it('rejects invalid dates and trims an optional note', () => {
    expectDomainError(
      () =>
        normalizeWeightMeasurement({
          weight: 450,
          measuredAt: new Date('invalid'),
          animalEntryDate,
          today,
        }),
      {
        code: 'validationFailed',
        details: [{ field: 'measuredAt', reason: 'invalidDate' }],
      },
    );

    expect(
      normalizeWeightMeasurement({
        weight: 450.125,
        measuredAt: new Date('2026-09-20T00:00:00.000Z'),
        animalEntryDate,
        note: '  balança do curral  ',
        today,
      }),
    ).toEqual({
      weight: 450.125,
      measuredAt: new Date('2026-09-20T00:00:00.000Z'),
      note: 'balança do curral',
    });
  });

  it('normalizes an auditable correction linked to the previous measurement', () => {
    expect(
      normalizeWeightCorrection({
        correctsMeasurementId: ' weight-previous ',
        correctionReason: '  erro de digitação  ',
        weight: 451.25,
        measuredAt: new Date('2026-09-20T00:00:00.000Z'),
        animalEntryDate,
        note: '  conferido  ',
        today,
      }),
    ).toEqual({
      correctsMeasurementId: 'weight-previous',
      correctionReason: 'erro de digitação',
      weight: 451.25,
      measuredAt: new Date('2026-09-20T00:00:00.000Z'),
      note: 'conferido',
    });
  });

  it.each([
    { correctsMeasurementId: '', correctionReason: 'motivo' },
    { correctsMeasurementId: 'weight-1', correctionReason: '   ' },
  ])('requires correction link and reason: %o', (correction) => {
    expectDomainError(
      () =>
        normalizeWeightCorrection({
          ...correction,
          weight: 451.25,
          measuredAt: new Date('2026-09-20T00:00:00.000Z'),
          animalEntryDate,
          today,
        }),
      { code: 'validationFailed' },
    );
  });
});
