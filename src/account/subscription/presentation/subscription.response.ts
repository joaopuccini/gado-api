import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionLimitsResponseDto {
  @ApiProperty() users!: number;
  @ApiProperty() farms!: number;
}

export class SubscriptionCountsResponseDto {
  @ApiProperty() users!: number;
  @ApiProperty() farms!: number;
}

export class SubscriptionSummaryResponseDto {
  @ApiProperty() planName!: string;
  @ApiProperty({ enum: ['active', 'expired', 'canceled'] }) status!: string;
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
  @ApiProperty({ type: SubscriptionLimitsResponseDto })
  limits!: SubscriptionLimitsResponseDto;
  @ApiProperty({ type: SubscriptionCountsResponseDto })
  currentCounts!: SubscriptionCountsResponseDto;
}
