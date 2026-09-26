import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CatalogDescriptionDto {
  @ApiProperty({ example: 'Nelore', maxLength: 100 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  description!: string;
}

export class CatalogPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class BreedResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  active!: boolean;
}

export class BatchResponseDto extends BreedResponseDto {
  @ApiProperty()
  farmId!: number;
}

export class BreedPageResponseDto {
  @ApiProperty({ type: BreedResponseDto, isArray: true })
  data!: BreedResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;
}

export class BatchPageResponseDto {
  @ApiProperty({ type: BatchResponseDto, isArray: true })
  data!: BatchResponseDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;
}
