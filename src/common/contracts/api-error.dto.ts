import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiMetaDto } from './api-meta.dto';

export class ApiErrorDetailDto {
  @ApiPropertyOptional({ example: 'earTagNumber' })
  field?: string;

  @ApiProperty({ example: 'isString' })
  reason!: string;
}

export class ApiErrorContentDto {
  @ApiProperty({ example: 'validationFailed' })
  code!: string;

  @ApiProperty({ example: 'Falha de validação' })
  message!: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];
}

export class ApiErrorMetaDto extends ApiMetaDto {
  @ApiProperty({ format: 'date-time' })
  timestamp!: string;

  @ApiProperty({ example: '/animals' })
  path!: string;
}

export class ApiErrorDto {
  @ApiProperty({ type: ApiErrorContentDto })
  error!: ApiErrorContentDto;

  @ApiProperty({ type: ApiErrorMetaDto })
  meta!: ApiErrorMetaDto;
}
