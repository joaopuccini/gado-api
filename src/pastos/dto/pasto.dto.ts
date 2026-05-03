import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePastoDto {
    @ApiProperty({ example: 'Pasto Norte' }) @IsString() @IsNotEmpty() descricao: string;
}

export class UpdatePastoDto {
    @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
}
