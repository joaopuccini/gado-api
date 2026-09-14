import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { ApiErrorDto } from './api-error.dto';
import { ApiMetaDto } from './api-meta.dto';
import { ApiSuccessDto } from './api-success.dto';

const swaggerProperties = (contract: object): string[] =>
  (Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, contract) ??
    []) as string[];

describe('public API contract DTOs', () => {
  it('publishes camelCase success envelope metadata', () => {
    expect(swaggerProperties(ApiSuccessDto.prototype)).toEqual(
      expect.arrayContaining([':data', ':meta']),
    );
    expect(swaggerProperties(ApiMetaDto.prototype)).toContain(':requestId');
  });

  it('publishes camelCase error envelope metadata', () => {
    expect(swaggerProperties(ApiErrorDto.prototype)).toEqual(
      expect.arrayContaining([':error', ':meta']),
    );
  });
});
