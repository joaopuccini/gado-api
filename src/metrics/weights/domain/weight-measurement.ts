import { DomainError } from '../../../common/errors/domain-error';

const MINIMUM_WEIGHT = 0;
const MAXIMUM_WEIGHT = 3000;

export interface NormalizeWeightMeasurementInput {
  weight: number;
  measuredAt: Date;
  animalEntryDate: Date;
  note?: string | null;
  today: Date;
}

export interface NormalizedWeightMeasurement {
  weight: number;
  measuredAt: Date;
  note: string | null;
}

export interface NormalizeWeightCorrectionInput
  extends NormalizeWeightMeasurementInput {
  correctsMeasurementId: string;
  correctionReason: string;
}

export interface NormalizedWeightCorrection
  extends NormalizedWeightMeasurement {
  correctsMeasurementId: string;
  correctionReason: string;
}

const validationError = (field: string, reason: string, message: string) =>
  new DomainError('validationFailed', message, [{ field, reason }]);

const assertValidDate = (field: string, value: Date): void => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw validationError(field, 'invalidDate', `${field} inválida.`);
  }
};

const requiredTrimmed = (field: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw validationError(field, 'required', `${field} é obrigatório.`);
  }
  return normalized;
};

const optionalTrimmed = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized || null;
};

const roundWeight = (weight: number): number =>
  Math.round((weight + Number.EPSILON) * 1000) / 1000;

export const normalizeWeightMeasurement = (
  input: NormalizeWeightMeasurementInput,
): NormalizedWeightMeasurement => {
  if (
    !Number.isFinite(input.weight) ||
    input.weight <= MINIMUM_WEIGHT ||
    input.weight > MAXIMUM_WEIGHT
  ) {
    throw validationError('weight', 'outOfRange', 'Peso inválido.');
  }

  assertValidDate('measuredAt', input.measuredAt);
  assertValidDate('animalEntryDate', input.animalEntryDate);
  assertValidDate('today', input.today);

  if (input.measuredAt.getTime() > input.today.getTime()) {
    throw validationError(
      'measuredAt',
      'futureDate',
      'A data da pesagem não pode estar no futuro.',
    );
  }

  if (input.measuredAt.getTime() < input.animalEntryDate.getTime()) {
    throw validationError(
      'measuredAt',
      'beforeAnimalEntry',
      'A data da pesagem não pode anteceder a entrada do animal.',
    );
  }

  return {
    weight: roundWeight(input.weight),
    measuredAt: new Date(input.measuredAt.getTime()),
    note: optionalTrimmed(input.note),
  };
};

export const normalizeWeightCorrection = (
  input: NormalizeWeightCorrectionInput,
): NormalizedWeightCorrection => ({
  ...normalizeWeightMeasurement(input),
  correctsMeasurementId: requiredTrimmed(
    'correctsMeasurementId',
    input.correctsMeasurementId,
  ),
  correctionReason: requiredTrimmed(
    'correctionReason',
    input.correctionReason,
  ),
});
