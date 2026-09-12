import { ApiProperty } from '@nestjs/swagger';

export class ApiMetaDto {
  @ApiProperty({ format: 'uuid' })
  requestId!: string;
}
