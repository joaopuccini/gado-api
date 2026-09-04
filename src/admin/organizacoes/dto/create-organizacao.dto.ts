import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { OrganizacaoStatus } from '@prisma/client-admin';

export class CreateOrganizacaoDto {
  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  @IsString()
  @IsNotEmpty()
  nomeFantasia: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsNotEmpty()
  subdomain: string;
}
