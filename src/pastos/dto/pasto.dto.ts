import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class CreatePastoDto {
    @ApiProperty({ example: 'Pasto Norte' }) @IsString() @IsNotEmpty() descricao: string;
    @ApiPropertyOptional() @IsOptional() @IsObject() geojson?: Record<string, any>;
    @ApiPropertyOptional() @IsOptional() @IsNumber() tamanhoHectares?: number;
}

export class UpdatePastoDto {
    @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
    @ApiPropertyOptional() @IsOptional() @IsObject() geojson?: Record<string, any>;
    @ApiPropertyOptional() @IsOptional() @IsNumber() tamanhoHectares?: number;
}
