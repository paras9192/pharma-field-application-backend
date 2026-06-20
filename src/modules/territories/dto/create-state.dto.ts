import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateStateDto {
  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MH' })
  @IsString()
  @Length(2, 5)
  code: string;
}
