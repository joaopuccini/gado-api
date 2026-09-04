import { PartialType } from '@nestjs/swagger';
import { CreatePlanoDto } from './create-plano.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePlanoDto extends PartialType(CreatePlanoDto) {
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
