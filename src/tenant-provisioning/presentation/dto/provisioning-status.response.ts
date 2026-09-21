import { ApiProperty } from '@nestjs/swagger';
import { ApiMetaDto } from '../../../common/contracts/api-meta.dto';
import type { PublicProvisioningState } from '../../application/ports/tenant-onboarding.repository';

export class ProvisioningAcceptedDataDto {
  @ApiProperty({ format: 'uuid' })
  provisioningRunId!: string;

  @ApiProperty({ enum: ['registered', 'provisioning'] })
  state!: 'registered' | 'provisioning';

  @ApiProperty({
    example: '/auth/provisioning/00000000-0000-4000-8000-000000000000',
  })
  statusUrl!: string;
}

export class ProvisioningStatusDataDto {
  @ApiProperty({ format: 'uuid' })
  provisioningRunId!: string;

  @ApiProperty({ enum: ['registered', 'provisioning', 'active', 'failed'] })
  state!: PublicProvisioningState;
}

export class ProvisioningAcceptedResponseDto {
  @ApiProperty({ type: ProvisioningAcceptedDataDto })
  data!: ProvisioningAcceptedDataDto;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;
}

export class ProvisioningStatusResponseDto {
  @ApiProperty({ type: ProvisioningStatusDataDto })
  data!: ProvisioningStatusDataDto;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;
}
