import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreatePlanoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsNumber()
  maxUsuarios: number;

  @IsNumber()
  @IsOptional()
  maxFazendas?: number;

  @IsNumber()
  precoMensal: number;
}
