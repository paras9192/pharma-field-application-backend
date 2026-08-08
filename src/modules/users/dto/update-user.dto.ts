import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from '@prisma/client';
import { Role } from '../../../common/enums/role.enum';

/**
 * Admin edit of any user (PATCH /users/:id). Covers the employment fields plus
 * everything a user can set on their own profile, so an admin can complete or
 * correct a record on someone's behalf. Validation for the personal fields
 * mirrors UpdateProfileDto — the two must stay in step, or the same value would
 * be accepted from the user and rejected from the admin editing them.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  // The login identity. Admin-only, and unique — changing it changes how the
  // user signs in, so the service rejects one already taken by someone else.
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.trim()?.toLowerCase())
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateOfJoining?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // ── Personal details (same shape as PATCH /users/me) ────────────────────────

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
