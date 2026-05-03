import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsDateString } from 'class-validator';

export class CreateMovPastoDto {
    @ApiProperty() @IsInt() @IsNotEmpty() id_animal: number;
    @ApiProperty() @IsInt() @IsNotEmpty() id_pasto_origem: number;
    @ApiProperty() @IsInt() @IsNotEmpty() id_pasto_destino: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_movimento?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}

export class CreateMovLoteDto {
    @ApiProperty() @IsInt() @IsNotEmpty() id_animal: number;
    @ApiProperty() @IsInt() @IsNotEmpty() id_lote_origem: number;
    @ApiProperty() @IsInt() @IsNotEmpty() id_lote_destino: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_movimento?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}
