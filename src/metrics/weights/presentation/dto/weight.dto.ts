import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class WeightPaginationDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  animalId?: number;

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

export class CreateWeightDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) animalId!: number;
  @ApiProperty({ minimum: 0.001, maximum: 3000 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(3000)
  weight!: number;
  @ApiProperty({ format: 'date' })
  @IsDateString({ strict: true })
  measuredAt!: string;
  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}

export class CorrectWeightDto {
  @ApiProperty({ minimum: 0.001, maximum: 3000 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(3000)
  weight!: number;
  @ApiProperty({ format: 'date' })
  @IsDateString({ strict: true })
  measuredAt!: string;
  @ApiProperty({ minLength: 1, maxLength: 500 })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  correctionReason!: string;
  @ApiPropertyOptional({ type: String, maxLength: 1000, nullable: true })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}

export class WeightResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() farmId!: number;
  @ApiProperty() animalId!: number;
  @ApiProperty({ type: Number }) weight!: number;
  @ApiProperty({ format: 'date' }) measuredAt!: string;
  @ApiProperty({ type: String, nullable: true }) note!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({ type: Number, nullable: true }) correctsMeasurementId!:
    | number
    | null;
  @ApiProperty({ type: String, nullable: true }) correctionReason!:
    | string
    | null;
  @ApiProperty({ type: Number, nullable: true }) registeredById!: number | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class WeightPageResponseDto {
  @ApiProperty({ type: WeightResponseDto, isArray: true })
  data!: WeightResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}
