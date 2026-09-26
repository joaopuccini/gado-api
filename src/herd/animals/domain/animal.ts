import { DomainError } from '../../../common/errors/domain-error';

export const ANIMAL_SEXES = ['MACHO', 'FEMEA'] as const;
export type AnimalSex = (typeof ANIMAL_SEXES)[number];

export const ANIMAL_STATUSES = [
  'ATIVO',
  'VENDIDO',
  'MORTO',
  'TRANSFERIDO',
] as const;
export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

export const ANIMAL_ENTRY_TYPES = [
  'COMPRA_OLHO',
  'COMPRA_KILO',
  'NASCIMENTO',
  'DOACAO',
  'TRANSFERENCIA',
] as const;
export type AnimalEntryType = (typeof ANIMAL_ENTRY_TYPES)[number];

const optionalTrimmed = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const normalizeEarTag = (
  value: string | null | undefined,
): string | null => {
  const normalized = optionalTrimmed(value);
  return normalized?.toLocaleUpperCase('pt-BR') ?? null;
};

export const assertAnimalEnum = <T extends string>(
  field: string,
  value: string,
  allowed: readonly T[],
): T => {
  if (!allowed.includes(value as T)) {
    throw new DomainError('validationFailed', `${field} inválido.`, [
      { field, reason: 'invalidEnumValue' },
    ]);
  }
  return value as T;
};

export const normalizeAnimalName = optionalTrimmed;
