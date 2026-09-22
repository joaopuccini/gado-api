import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ minLength: 2, maxLength: 100 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ type: [Number], minItems: 1, uniqueItems: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissionIds!: number[];
}
