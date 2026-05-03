import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'João Pedro' })
    @IsString()
    @IsNotEmpty({ message: 'Nome é obrigatório' })
    nome: string;

    @ApiProperty({ example: 'joao@email.com' })
    @IsEmail({}, { message: 'Email inválido' })
    @IsNotEmpty({ message: 'Email é obrigatório' })
    email: string;

    @ApiProperty({ example: 'senha123' })
    @IsString()
    @IsNotEmpty({ message: 'Senha é obrigatória' })
    @MinLength(4, { message: 'Senha deve ter no mínimo 4 caracteres' })
    password: string;

    @ApiPropertyOptional({ example: '11999999999' })
    @IsOptional()
    @IsString()
    celular?: string;

    @IsOptional() @IsBoolean() acesso_geral?: boolean;
    @IsOptional() @IsBoolean() acesso_animais?: boolean;
    @IsOptional() @IsBoolean() acesso_dashboard?: boolean;
    @IsOptional() @IsBoolean() acesso_custos?: boolean;
    @IsOptional() @IsBoolean() acesso_caixa?: boolean;
    @IsOptional() @IsBoolean() acesso_vendas?: boolean;
    @IsOptional() @IsBoolean() acesso_saldo?: boolean;
    @IsOptional() @IsBoolean() acesso_manejo?: boolean;
    @IsOptional() @IsBoolean() acesso_racas?: boolean;
    @IsOptional() @IsBoolean() acesso_lotes?: boolean;
    @IsOptional() @IsBoolean() acesso_pastos?: boolean;
    @IsOptional() @IsBoolean() acesso_clientes?: boolean;
}
