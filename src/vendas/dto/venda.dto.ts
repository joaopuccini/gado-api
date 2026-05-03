import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsInt, IsArray, IsDateString } from 'class-validator';

export class CreateVendaDto {
    @ApiProperty() @IsArray() @IsInt({ each: true }) id_animais: number[];
    @ApiProperty() @IsInt() @IsNotEmpty() id_cliente: number;
    @ApiProperty() @IsNumber() @IsNotEmpty() valor_venda: number;
    @ApiPropertyOptional() @IsNumber() @IsOptional() valor_custo?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_venda?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}
