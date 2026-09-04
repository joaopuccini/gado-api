import { PartialType } from '@nestjs/swagger';
import { CreateAdminUserDto } from './create-admin-user.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAdminUserDto extends PartialType(CreateAdminUserDto) {
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
