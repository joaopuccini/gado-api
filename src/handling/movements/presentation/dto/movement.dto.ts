import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trim = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

class BaseMovementDto {
  @ApiProperty({ minimum: 1, example: 5 })
  @IsInt()
  @Min(1)
  animalId!: number;

  @ApiProperty({ format: 'date', example: '2026-09-28' })
  @IsDateString({ strict: true })
  movementDate!: string;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true, example: 'Rotação' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

export class PastureMovementDto extends BaseMovementDto {
  @ApiProperty({ minimum: 1, example: 8 })
  @IsInt()
  @Min(1)
  destinationPastureId!: number;
}

export class BatchMovementDto extends BaseMovementDto {
  @ApiProperty({ minimum: 1, example: 9 })
  @IsInt()
  @Min(1)
  destinationBatchId!: number;
}

export class MovementHistoryQueryDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  animalId?: number;

  @ApiPropertyOptional({ enum: ['pasture', 'batch'] })
  @IsOptional()
  @IsIn(['pasture', 'batch'])
  kind?: 'pasture' | 'batch';

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
  pageSize = 20;
}

export class MovementResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ enum: ['pasture', 'batch'] }) kind!: 'pasture' | 'batch';
  @ApiProperty() farmId!: number;
  @ApiProperty() animalId!: number;
  @ApiProperty() originId!: number;
  @ApiProperty() destinationId!: number;
  @ApiProperty({ type: Number, nullable: true }) registeredById!: number | null;
  @ApiProperty({ format: 'date' }) movementDate!: string;
  @ApiProperty({ type: String, nullable: true }) notes!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class MovementHistoryPageResponseDto {
  @ApiProperty({ type: MovementResponseDto, isArray: true })
  data!: MovementResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() totalItems!: number;
  @ApiProperty() totalPages!: number;
}
