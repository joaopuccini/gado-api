import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../common/contracts/api-error.dto';
import { ApiSuccessDto } from '../../../common/contracts/api-success.dto';

interface HerdResponseOptions {
  readonly type: Type<unknown>;
  readonly created?: boolean;
  readonly acceptsInput?: boolean;
}

export const ApiHerdResponse = ({
  type,
  created = false,
  acceptsInput = false,
}: HerdResponseOptions): MethodDecorator => {
  const response = {
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessDto) },
        { properties: { data: { $ref: getSchemaPath(type) } } },
      ],
    },
  };
  return applyDecorators(
    ApiExtraModels(ApiSuccessDto, ApiErrorDto, type),
    created ? ApiCreatedResponse(response) : ApiOkResponse(response),
    ...(acceptsInput ? [ApiBadRequestResponse({ type: ApiErrorDto })] : []),
    ApiUnauthorizedResponse({ type: ApiErrorDto }),
    ApiForbiddenResponse({ type: ApiErrorDto }),
    ApiNotFoundResponse({ type: ApiErrorDto }),
    ApiConflictResponse({ type: ApiErrorDto }),
    ApiInternalServerErrorResponse({ type: ApiErrorDto }),
  );
};
