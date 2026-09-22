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

export class TeamFarmSummaryResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
}

export class TeamMemberSummaryResponseDto {
  @ApiProperty() localUserId!: number;
  @ApiProperty({ format: 'uuid' }) globalUserId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ type: [Number] }) farmIds!: readonly number[];
  @ApiProperty() role!: string;
  @ApiPropertyOptional({ nullable: true }) profileId!: number | null;
  @ApiProperty() active!: boolean;
}

export class TeamInvitationResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ enum: ['pending', 'accepted', 'revoked', 'expired'] })
  status!: string;
  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
}

export class TeamPermissionResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
}

export class TeamSummaryResponseDto {
  @ApiProperty({ type: [TeamFarmSummaryResponseDto] })
  farms!: readonly TeamFarmSummaryResponseDto[];
  @ApiProperty({ type: [TeamMemberSummaryResponseDto] })
  members!: readonly TeamMemberSummaryResponseDto[];
  @ApiProperty({ type: [TeamInvitationResponseDto] })
  invitations!: readonly TeamInvitationResponseDto[];
  @ApiProperty({ type: [TeamProfileResponseDto] })
  profiles!: readonly TeamProfileResponseDto[];
  @ApiProperty({ type: [TeamPermissionResponseDto] })
  permissions!: readonly TeamPermissionResponseDto[];
}
