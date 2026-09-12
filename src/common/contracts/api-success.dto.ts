import { ApiProperty } from '@nestjs/swagger';
import { ApiMetaDto } from './api-meta.dto';

export class ApiSuccessDto<T = unknown> {
  @ApiProperty({ type: Object })
  data!: T;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;
}
