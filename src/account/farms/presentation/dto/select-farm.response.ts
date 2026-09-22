import { ApiProperty } from '@nestjs/swagger';

export class SelectFarmResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;
}
