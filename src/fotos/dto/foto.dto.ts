import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsDateString } from 'class-validator';

export class CreateFotoDto {
    @ApiProperty() @IsInt() @IsNotEmpty() id_animal: number;
    @ApiPropertyOptional() @IsOptional() @IsString() descricao_foto?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() caminho?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_foto?: string;
}

export class UpdateFotoDto {
    @ApiPropertyOptional() @IsOptional() @IsInt() id_animal?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() descricao_foto?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() caminho?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_foto?: string;
}
