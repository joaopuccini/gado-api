import { DomainError } from '../../../common/errors/domain-error';

export const normalizeCatalogDescription = (description: string): string => {
  const normalized = description.trim();
  if (normalized.length === 0) {
    throw new DomainError('validationFailed', 'A descrição é obrigatória.', [
      { field: 'description', reason: 'required' },
    ]);
  }
  return normalized;
};
