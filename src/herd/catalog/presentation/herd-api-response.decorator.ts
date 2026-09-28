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
  type ApiResponseNoStatusOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../common/contracts/api-error.dto';
import { ApiMetaDto } from '../../../common/contracts/api-meta.dto';
import { ApiSuccessDto } from '../../../common/contracts/api-success.dto';

interface HerdResponseOptions {
  readonly type: Type<unknown>;
  readonly created?: boolean;
  readonly acceptsInput?: boolean;
  readonly paginated?: boolean;
}

export const ApiHerdResponse = ({
  type,
  created = false,
  acceptsInput = false,
  paginated = false,
}: HerdResponseOptions): MethodDecorator => {
  const dataSchema = paginated
    ? { type: 'array', items: { $ref: getSchemaPath(type) } }
    : { $ref: getSchemaPath(type) };
  const metaSchema = paginated
    ? {
        allOf: [{ $ref: getSchemaPath(ApiMetaDto) }],
        required: ['page', 'pageSize', 'totalItems', 'totalPages'],
        properties: {
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1 },
          totalItems: { type: 'integer', minimum: 0 },
          totalPages: { type: 'integer', minimum: 0 },
        },
      }
    : undefined;
  const response = {
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessDto) },
        {
          properties: {
            data: dataSchema,
            ...(metaSchema ? { meta: metaSchema } : {}),
          },
        },
      ],
    },
  } as ApiResponseNoStatusOptions;
  return applyDecorators(
    ApiExtraModels(ApiSuccessDto, ApiErrorDto, ApiMetaDto, type),
    created ? ApiCreatedResponse(response) : ApiOkResponse(response),
    ...(acceptsInput ? [ApiBadRequestResponse({ type: ApiErrorDto })] : []),
    ApiUnauthorizedResponse({ type: ApiErrorDto }),
    ApiForbiddenResponse({ type: ApiErrorDto }),
    ApiNotFoundResponse({ type: ApiErrorDto }),
    ApiConflictResponse({ type: ApiErrorDto }),
    ApiInternalServerErrorResponse({ type: ApiErrorDto }),
  );
};
