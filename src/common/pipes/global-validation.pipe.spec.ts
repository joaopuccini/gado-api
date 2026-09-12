import type { ArgumentMetadata } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { DomainError } from '../errors/domain-error';
import { GlobalValidationPipe } from './global-validation.pipe';

class ProbeInputDto {
  @IsString()
  @IsNotEmpty()
  earTagNumber!: string;
}

const bodyMetadata: ArgumentMetadata = {
  type: 'body',
  metatype: ProbeInputDto,
  data: undefined,
};

const validationError = async (
  pipe: GlobalValidationPipe,
  value: unknown,
): Promise<DomainError> => {
  try {
    await pipe.transform(value, bodyMetadata);
    throw new Error('Expected validation to fail');
  } catch (error: unknown) {
    if (error instanceof DomainError) return error;
    throw error;
  }
};

describe('GlobalValidationPipe', () => {
  it('transforms valid input into the declared DTO', async () => {
    const result = await new GlobalValidationPipe().transform(
      { earTagNumber: 'brinco-100' },
      bodyMetadata,
    );

    expect(result).toBeInstanceOf(ProbeInputDto);
    expect(result).toEqual({ earTagNumber: 'brinco-100' });
  });

  it('rejects unknown properties instead of silently accepting them', async () => {
    const error = await validationError(new GlobalValidationPipe(), {
      earTagNumber: 'brinco-100',
      tenantId: 'attacker-tenant',
    });

    expect(error).toMatchObject({
      code: 'validationFailed',
      details: [{ field: 'tenantId', reason: 'whitelistValidation' }],
    });
  });

  it('returns stable field and constraint codes for invalid types', async () => {
    const error = await validationError(new GlobalValidationPipe(), {
      earTagNumber: 100,
    });

    expect(error).toMatchObject({
      code: 'validationFailed',
      details: [{ field: 'earTagNumber', reason: 'isString' }],
    });
  });
});
