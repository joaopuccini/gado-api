import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'support@gado.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'senha-segura' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class AdminLoginDataDto {
  @ApiProperty()
  token!: string;
}
