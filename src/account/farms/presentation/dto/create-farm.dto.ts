import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFarmDto {
  @ApiProperty({ example: 'Fazenda Sul', minLength: 2, maxLength: 200 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ example: 10, nullable: true, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number | null;
}
