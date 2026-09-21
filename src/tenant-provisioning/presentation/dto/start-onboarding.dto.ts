import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class StartOnboardingDto {
  @ApiProperty({ example: 'João Pedro' })
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'senha-segura' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Fazenda Principal' })
  @IsString()
  @IsNotEmpty()
  farmName!: string;
}
