import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PastureInputDto {
  @ApiProperty({ example: 'Pasto Norte', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  description!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  geoJson!: Record<string, unknown>;

  @ApiPropertyOptional({ example: '12.500' })
  @IsOptional()
  @IsNumberString()
  areaHectares?: string;
}

export class PasturePaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class PastureResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() farmId!: number;
  @ApiProperty() description!: string;
  @ApiProperty({ type: 'object', additionalProperties: true }) geoJson!: object;
  @ApiPropertyOptional() areaHectares?: string;
  @ApiProperty() active!: boolean;
}

export class PasturePageResponseDto {
  @ApiProperty({ type: [PastureResponseDto] }) data!: PastureResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}
