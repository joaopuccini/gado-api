import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsNumber, IsBoolean, IsDateString, IsArray } from 'class-validator';

export class CreateAnimalDto {
    @ApiPropertyOptional({ description: 'Nomes dos usuários responsáveis', example: ['João', 'Maria'] })
    @IsOptional() @IsArray() @IsString({ each: true }) id_usuario_nome?: string[];

    @ApiProperty({ description: 'ID do Lote', example: 1 })
    @IsInt() @IsNotEmpty() id_lote: number;

    @ApiProperty({ description: 'ID da Raça', example: 1 })
    @IsInt() @IsNotEmpty() id_raca: number;

    @ApiPropertyOptional({ description: 'ID do Cliente (se comprado de terceiros)', example: 1 })
    @IsOptional() @IsInt() id_cliente?: number;

    @ApiProperty({ description: 'ID do Pasto atual', example: 1 })
    @IsInt() @IsNotEmpty() id_pasto: number;

    @ApiPropertyOptional({ description: 'Indica se é uma matriz (vaca de cria)', example: false })
    @IsOptional() @IsBoolean() matriz?: boolean;

    @ApiPropertyOptional({ description: 'Nome ou identificação visual', example: 'Mmimosa 12' })
    @IsOptional() @IsString() nome?: string;

    @ApiPropertyOptional({ description: 'Status vital/comercial', example: 'ATIVO', enum: ['ATIVO', 'VENDIDO', 'MORTO'] })
    @IsOptional() @IsString() status?: string;

    @ApiPropertyOptional({ description: 'Sexo do animal', example: 'M', enum: ['M', 'F'] })
    @IsOptional() @IsString() sexo?: string;

    @ApiPropertyOptional({ description: 'Data de nascimento', example: '2023-01-01' })
    @IsOptional() @IsDateString() nascimento?: string;

    @ApiPropertyOptional({ description: 'Número do brinco de identificação', example: 101 })
    @IsOptional() @IsNumber() numero_brinco?: number;

    @ApiPropertyOptional({ description: 'Data de entrada na fazenda', example: '2024-04-17' })
    @IsOptional() @IsDateString() data_entrada?: string;

    @ApiPropertyOptional({ description: 'Preço por Kg na compra', example: 12.50 })
    @IsOptional() @IsNumber() preco_kilo?: number;

    @ApiPropertyOptional({ description: 'Peso inicial (Kg)', example: 250.0 })
    @IsOptional() @IsNumber() peso?: number;

    @ApiPropertyOptional({ description: 'Tipo de compra', example: 'OLHO', enum: ['OLHO', 'KILO', 'NASCIMENTO'] })
    @IsOptional() @IsString() tipo_compra?: string;

    @ApiPropertyOptional({ description: 'Valor total da compra', example: 3000.0 })
    @IsOptional() @IsNumber() total?: number;

    @ApiPropertyOptional({ description: 'Total de custos acumulados', example: 150.0 })
    @IsOptional() @IsNumber() valor_custo_final?: number;

    @ApiPropertyOptional({ description: 'Indica se o animal é castrado', example: false })
    @IsOptional() @IsBoolean() castrado?: boolean;

    @ApiPropertyOptional({ description: 'Observações gerais', example: 'Animal dócil' })
    @IsOptional() @IsString() observacao?: string;
}

export class UpdateAnimalDto {
    @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) id_usuario_nome?: string[];
    @ApiPropertyOptional() @IsOptional() @IsInt() id_lote?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() id_raca?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() id_cliente?: number;
    @ApiPropertyOptional() @IsOptional() @IsInt() id_pasto?: number;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() matriz?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsString() nome?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() sexo?: string;
    @ApiPropertyOptional() @IsOptional() @IsDateString() nascimento?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() numero_brinco?: number;
    @ApiPropertyOptional() @IsOptional() @IsDateString() data_entrada?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() preco_kilo?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() peso?: number;
    @ApiPropertyOptional() @IsOptional() @IsString() tipo_compra?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() total?: number;
    @ApiPropertyOptional() @IsOptional() @IsNumber() valor_custo_final?: number;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() castrado?: boolean;
    @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}
