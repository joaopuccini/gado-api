import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsInt, IsArray, IsDateString } from 'class-validator';

export class CreateCustoDto {
    @ApiProperty() @IsArray() @IsInt({ each: true }) id_animais: number[];
    @ApiProperty() @IsInt() @IsNotEmpty() id_custo_tipos: number;
    @ApiPropertyOptional() @IsInt() @IsOptional() qtd_animais?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
    @ApiProperty() @IsNumber() @IsNotEmpty() valor_custo: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_custo?: string;
}

export class CreateCustoTipoDto {
    @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
}
