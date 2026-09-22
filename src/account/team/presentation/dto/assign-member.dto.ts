import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AssignMemberDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  globalUserId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  farmId!: number;

  @ApiProperty({ enum: ['DONO', 'GESTOR', 'COLABORADOR', 'CONSULTOR'] })
  @IsIn(['DONO', 'GESTOR', 'COLABORADOR', 'CONSULTOR'])
  role!: string;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  profileId?: number | null;
}
