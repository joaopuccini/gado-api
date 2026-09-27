import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ANIMAL_ENTRY_TYPES,
  ANIMAL_SEXES,
  ANIMAL_STATUSES,
  type AnimalEntryType,
  type AnimalSex,
  type AnimalStatus,
} from '../../domain/animal';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class AnimalPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class CreateAnimalDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) loteId!: number;
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) racaId!: number;
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) pastoId!: number;
  @ApiPropertyOptional({ type: Number, minimum: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number | null;
  @ApiPropertyOptional({ type: String, maxLength: 100, nullable: true })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  nome?: string | null;
  @ApiPropertyOptional({ type: String, maxLength: 50, nullable: true })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @Length(1, 50)
  numeroBrinco?: string | null;
  @ApiProperty({ enum: ANIMAL_SEXES }) @IsEnum(ANIMAL_SEXES) sexo!: AnimalSex;
  @ApiPropertyOptional({ enum: ANIMAL_STATUSES, default: 'ATIVO' })
  @IsOptional()
  @IsEnum(ANIMAL_STATUSES)
  status?: AnimalStatus;
  @ApiProperty({ enum: ANIMAL_ENTRY_TYPES })
  @IsEnum(ANIMAL_ENTRY_TYPES)
  tipoEntrada!: AnimalEntryType;
  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  nascimento?: string | null;
  @ApiProperty({ format: 'date' })
  @IsDateString({ strict: true })
  dataEntrada!: string;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  pesoEntrada?: number | null;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoKilo?: number | null;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorCompra?: number | null;
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorCustoTotal?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  matriz?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  castrado?: boolean;
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  observacao?: string | null;
}

export class UpdateAnimalDto {
  @ApiPropertyOptional({ type: String, maxLength: 100, nullable: true })
  @ValidateIf((value: UpdateAnimalDto) =>
    Object.values(value).every((entry) => entry === undefined),
  )
  @IsDefined()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(100)
  nome?: string | null;
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  loteId?: number;
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  racaId?: number;
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pastoId?: number;
  @ApiPropertyOptional({ type: Number, minimum: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  clienteId?: number | null;
  @ApiPropertyOptional({ type: String, maxLength: 50, nullable: true })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @Length(1, 50)
  numeroBrinco?: string | null;
  @ApiPropertyOptional({ enum: ANIMAL_SEXES })
  @IsOptional()
  @IsEnum(ANIMAL_SEXES)
  sexo?: AnimalSex;
  @ApiPropertyOptional({ enum: ANIMAL_STATUSES })
  @IsOptional()
  @IsEnum(ANIMAL_STATUSES)
  status?: AnimalStatus;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  pesoAtual?: number;
}

export class AnimalResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() fazendaId!: number;
  @ApiProperty() loteId!: number;
  @ApiProperty() racaId!: number;
  @ApiProperty() pastoId!: number;
  @ApiProperty({ type: Number, nullable: true }) clienteId!: number | null;
  @ApiProperty({ type: String, nullable: true }) nome!: string | null;
  @ApiProperty({ type: String, nullable: true }) numeroBrinco!: string | null;
  @ApiPropertyOptional({ enum: ANIMAL_SEXES, nullable: true })
  sexo!: AnimalSex | null;
  @ApiProperty({ enum: ANIMAL_STATUSES }) status!: AnimalStatus;
  @ApiProperty({ enum: ANIMAL_ENTRY_TYPES }) tipoEntrada!: AnimalEntryType;
  @ApiProperty({ type: String, format: 'date', nullable: true }) nascimento!:
    | string
    | null;
  @ApiProperty({ format: 'date' }) dataEntrada!: string;
  @ApiProperty({ type: Number, nullable: true }) pesoEntrada!: number | null;
  @ApiProperty({ type: Number, nullable: true }) pesoAtual!: number | null;
  @ApiProperty({ type: Number, nullable: true }) precoKilo!: number | null;
  @ApiProperty({ type: Number, nullable: true }) valorCompra!: number | null;
  @ApiProperty({ type: Number, nullable: true }) valorCustoTotal!:
    | number
    | null;
  @ApiProperty() matriz!: boolean;
  @ApiProperty() castrado!: boolean;
  @ApiProperty({ type: String, nullable: true }) observacao!: string | null;
  @ApiProperty() ativo!: boolean;
}

export class AnimalPageResponseDto {
  @ApiProperty({ type: AnimalResponseDto, isArray: true })
  data!: AnimalResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}
