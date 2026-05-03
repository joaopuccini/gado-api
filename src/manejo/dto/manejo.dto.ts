import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsDateString } from 'class-validator';

export class CreateManejoDto {
    @ApiProperty() @IsInt() @IsNotEmpty() id_animal: number; // Vaca
    @ApiProperty() @IsInt() @IsNotEmpty() id_boi: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_corre?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}

export class UpdateManejoDto {
    @ApiPropertyOptional() @IsOptional() @IsInt() id_animal?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() id_boi?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_corre?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}
