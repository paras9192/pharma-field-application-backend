import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

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
}
