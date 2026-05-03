import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsInt, IsDateString } from 'class-validator';

export class CreateKiloDto {
    @ApiProperty() @IsInt() @IsNotEmpty() id_animal: number;
    @ApiProperty() @IsNumber() @IsNotEmpty() peso: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_pesagem?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}

export class UpdateKiloDto {
    @ApiPropertyOptional() @IsOptional() @IsInt() id_animal?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() peso?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_pesagem?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}
