import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/contracts/api-error.dto';
import { ApiSuccessDto } from '../../common/contracts/api-success.dto';

interface AccountResponseOptions {
  readonly type: Type<unknown>;
  readonly isArray?: boolean;
  readonly created?: boolean;
  readonly acceptsInput?: boolean;
}

export const ApiAccountResponse = ({
  type,
  isArray = false,
  created = false,
  acceptsInput = false,
}: AccountResponseOptions): MethodDecorator => {
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(type) } }
    : { $ref: getSchemaPath(type) };
  const successResponse = {
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessDto) },
        { properties: { data: dataSchema } },
      ],
    },
  };

  return applyDecorators(
    ApiExtraModels(ApiSuccessDto, ApiErrorDto, type),
    created
      ? ApiCreatedResponse(successResponse)
      : ApiOkResponse(successResponse),
    ...(acceptsInput ? [ApiBadRequestResponse({ type: ApiErrorDto })] : []),
    ApiUnauthorizedResponse({ type: ApiErrorDto }),
    ApiForbiddenResponse({ type: ApiErrorDto }),
    ApiInternalServerErrorResponse({ type: ApiErrorDto }),
  );
};
