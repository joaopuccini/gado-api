import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({ minLength: 16, maxLength: 512 })
  @IsString()
  @Length(16, 512)
  token!: string;
}
