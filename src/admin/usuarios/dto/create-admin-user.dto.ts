import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { AdminRole } from '@prisma/client-admin';

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  senha: string; // The service will hash this

  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;
}
