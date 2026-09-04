import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AssinaturaStatus } from '@prisma/client-admin';

export class CreateAssinaturaDto {
  @IsUUID()
  @IsNotEmpty()
  organizacaoId: string;

  @IsUUID()
  @IsNotEmpty()
  planoId: string;

  @IsInt()
  @IsNotEmpty()
  diaVencimento: number;

  @IsOptional()
  @IsInt()
  mesesGerarPagamento?: number; // Equivalente ao "meses" do antigo ControllerPlanoMensalidades
}
