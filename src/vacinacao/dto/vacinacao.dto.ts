import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsDateString } from 'class-validator';

export class CreateVacinacaoDto {
    @ApiProperty() @IsInt() @IsNotEmpty() id_animal: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_vacinacao?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}

export class UpdateVacinacaoDto {
    @ApiPropertyOptional() @IsOptional() @IsInt() id_animal?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_vacinacao?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}
