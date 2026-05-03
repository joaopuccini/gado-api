import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLoteDto {
    @ApiProperty({ example: 'Lote A' })
    @IsString()
    @IsNotEmpty()
    descricao: string;
}

export class UpdateLoteDto {
    @ApiPropertyOptional({ example: 'Lote A Atualizado' })
    @IsOptional()
    @IsString()
    descricao?: string;
}
