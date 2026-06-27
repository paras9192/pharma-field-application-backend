import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class CreateStateDto {
  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MH' })
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  @IsString()
  @Length(2, 5)
  code: string;
}
