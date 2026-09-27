import { ApiProperty } from '@nestjs/swagger';

export class DashboardEvolutionDto {
  @ApiProperty({ example: '2026-09' }) month!: string;
  @ApiProperty({ type: Number, nullable: true }) averageWeight!: number | null;
}

export class DashboardDistributionDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() animalCount!: number;
  @ApiProperty({ type: Number, nullable: true }) averageWeight!: number | null;
}

export class DashboardAlertDto {
  @ApiProperty({ enum: ['NO_WEIGHT', 'STALE_WEIGHT', 'WEIGHT_LOSS'] })
  type!: 'NO_WEIGHT' | 'STALE_WEIGHT' | 'WEIGHT_LOSS';
  @ApiProperty() animalId!: number;
  @ApiProperty({ type: String, format: 'date', nullable: true })
  lastMeasuredAt!: string | null;
}

export class MarketPriceResponseDto {
  @ApiProperty({ type: Number }) value!: number;
  @ApiProperty({ format: 'date' }) observedAt!: string;
  @ApiProperty({ format: 'date-time' }) fetchedAt!: string;
  @ApiProperty({ enum: ['fresh', 'stale'] }) freshness!: 'fresh' | 'stale';
}

export class DashboardResponseDto {
  @ApiProperty() activeAnimals!: number;
  @ApiProperty({ type: Number, nullable: true }) averageWeight!: number | null;
  @ApiProperty({ type: Number, nullable: true }) averageDailyGain!:
    | number
    | null;
  @ApiProperty({ type: DashboardEvolutionDto, isArray: true })
  monthlyEvolution!: DashboardEvolutionDto[];
  @ApiProperty({ type: DashboardDistributionDto, isArray: true })
  byBatch!: DashboardDistributionDto[];
  @ApiProperty({ type: DashboardDistributionDto, isArray: true })
  byPasture!: DashboardDistributionDto[];
  @ApiProperty({ type: DashboardAlertDto, isArray: true })
  alerts!: DashboardAlertDto[];
  @ApiProperty({ type: MarketPriceResponseDto, nullable: true })
  marketPrice!: MarketPriceResponseDto | null;
}
