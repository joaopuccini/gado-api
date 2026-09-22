import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamMemberResponseDto {
  @ApiProperty() localUserId!: number;
  @ApiProperty({ format: 'uuid' }) globalUserId!: string;
  @ApiProperty() farmId!: number;
  @ApiProperty() role!: string;
  @ApiPropertyOptional({ nullable: true }) profileId!: number | null;
  @ApiProperty() active!: boolean;
}

export class TeamProfileResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() farmId!: number;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiPropertyOptional({ nullable: true }) systemRole!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty({ type: [Number] }) permissionIds!: readonly number[];
}
