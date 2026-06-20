import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ example: 18.9394 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 72.8355 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
