import { Injectable, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { DomainError } from '../errors/domain-error';
import type { ErrorDetail } from '../errors/error-catalog';

const errorDetails = (
  errors: ValidationError[],
  parentPath = '',
): ErrorDetail[] =>
  errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const ownDetails = Object.keys(error.constraints ?? {}).map((reason) => ({
      field,
      reason,
    }));
    return [...ownDetails, ...errorDetails(error.children ?? [], field)];
  });

@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: false,
      exceptionFactory: (errors: ValidationError[]) =>
        new DomainError(
          'validationFailed',
          'Falha de validação',
          errorDetails(errors),
        ),
    });
  }
}
