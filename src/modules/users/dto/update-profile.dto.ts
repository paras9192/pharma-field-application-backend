import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from '@prisma/client';

/**
 * Self-service profile edit (PATCH /users/me). Intentionally excludes
 * email, role, employeeCode, isActive — those stay admin-only. Photo and
 * KYC documents are uploaded via their own multipart endpoints.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '1995-08-21', description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'O+' })
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  @IsString()
  @MaxLength(5)
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Short about/bio' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  emergencyContactPhone?: string;
}
