import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

export class CreateDailyReportDto {
  @ApiProperty({ example: '2025-06-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productsDiscussed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competitorActivity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  highlights?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ enum: ReportStatus, default: ReportStatus.DRAFT })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
