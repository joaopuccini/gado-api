import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRacaDto {
    @ApiProperty({ example: 'Nelore' })
    @IsString()
    @IsNotEmpty()
    descricao: string;
}

export class UpdateRacaDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    descricao?: string;
}
