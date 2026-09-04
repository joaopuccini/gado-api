import { PartialType } from '@nestjs/swagger';
import { CreateAssinaturaDto } from './create-assinatura.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AssinaturaStatus } from '@prisma/client-admin';

export class UpdateAssinaturaDto extends PartialType(CreateAssinaturaDto) {
  @IsEnum(AssinaturaStatus)
  @IsOptional()
  status?: AssinaturaStatus;
}
