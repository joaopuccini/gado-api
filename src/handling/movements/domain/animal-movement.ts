import { DomainError } from '../../../common/errors/domain-error';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const normalizeMovementDate = (value: string): string => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !DATE_ONLY_PATTERN.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new DomainError(
      'validationFailed',
      'Data da movimentação inválida.',
      [{ field: 'movementDate', reason: 'invalidDate' }],
    );
  }
  return value;
};

export const normalizeMovementNotes = (
  value: string | null | undefined,
): string | null => {
  const normalized = value?.trim() ?? '';
  return normalized.length === 0 ? null : normalized;
};

export const assertDifferentLocation = (
  field: 'destinationPastureId' | 'destinationBatchId',
  originId: number,
  destinationId: number,
): void => {
  if (originId === destinationId) {
    throw new DomainError(
      'validationFailed',
      'A origem e o destino da movimentação devem ser diferentes.',
      [{ field, reason: 'sameAsOrigin' }],
    );
  }
};
