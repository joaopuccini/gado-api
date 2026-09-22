import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FarmResponseDto {
  @ApiProperty({ example: 20 })
  id!: number;

  @ApiProperty({ example: 'Fazenda Sul' })
  name!: string;

  @ApiPropertyOptional({ example: 10, nullable: true })
  parentId!: number | null;

  @ApiProperty({ example: true })
  active!: boolean;
}
