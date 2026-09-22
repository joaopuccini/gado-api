import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationContactResponseDto {
  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;
}

export class OrganizationAccountResponseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  legalName!: string;

  @ApiProperty({ type: OrganizationContactResponseDto })
  contact!: OrganizationContactResponseDto;

  @ApiProperty({ enum: ['trial', 'active', 'suspended', 'canceled'] })
  status!: string;
}
