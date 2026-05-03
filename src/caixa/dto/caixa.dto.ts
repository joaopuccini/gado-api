import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsDateString } from 'class-validator';

export class CreateCaixaDto {
    @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
    @ApiProperty() @IsNumber() @IsNotEmpty() valor: number;
    @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) id_usuario_nome?: string[];
    @ApiProperty() @IsString() @IsNotEmpty() operacao: string; // ENTRADA, SAIDA
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_operacao?: string;
}

export class UpdateCaixaDto {
    @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() valor?: number;
    @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) id_usuario_nome?: string[];
    @ApiPropertyOptional() @IsOptional() @IsString() operacao?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_operacao?: string;
}
