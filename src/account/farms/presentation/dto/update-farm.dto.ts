import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFarmDto {
  @ApiPropertyOptional({ example: 'Fazenda Sul', minLength: 2, maxLength: 200 })
  @ValidateIf(
    (value: UpdateFarmDto) =>
      value.name !== undefined || value.parentId === undefined,
  )
  @IsDefined()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 200)
  name?: string;

  @ApiPropertyOptional({ example: 10, nullable: true, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number | null;
}
