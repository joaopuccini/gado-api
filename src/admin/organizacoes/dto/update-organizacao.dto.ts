import { PartialType } from '@nestjs/swagger';
import { CreateOrganizacaoDto } from './create-organizacao.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { OrganizacaoStatus } from '@prisma/client-admin';

export class UpdateOrganizacaoDto extends PartialType(CreateOrganizacaoDto) {
  @IsEnum(OrganizacaoStatus)
  @IsOptional()
  status?: OrganizacaoStatus;
}
