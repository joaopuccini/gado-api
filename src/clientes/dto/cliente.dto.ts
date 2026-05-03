import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateClienteDto {
    @ApiProperty({ example: 'João Silva' }) @IsString() @IsNotEmpty() nome: string;
    @ApiPropertyOptional() @IsOptional() @IsString() celular?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cpf_cnpj?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cep?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cidade?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() bairro?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() endereco?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() estado?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() numero?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}

export class UpdateClienteDto {
    @ApiPropertyOptional() @IsOptional() @IsString() nome?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() celular?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cpf_cnpj?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cep?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cidade?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() bairro?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() endereco?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() estado?: string;
    @ApiPropertyOptional() @IsOptional() @IsInt() numero?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}
