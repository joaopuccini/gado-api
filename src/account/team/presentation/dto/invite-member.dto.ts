import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ format: 'email' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['CONVIDADO'] })
  @IsIn(['CONVIDADO'])
  role!: string;
}
