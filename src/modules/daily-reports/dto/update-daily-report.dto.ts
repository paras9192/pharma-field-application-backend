import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from './create-daily-report.dto';

export class UpdateDailyReportDto {
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

  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
