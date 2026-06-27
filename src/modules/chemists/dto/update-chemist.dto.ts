import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateChemistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  territoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
