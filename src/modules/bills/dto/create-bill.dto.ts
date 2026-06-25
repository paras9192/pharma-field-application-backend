import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateBillDto {
  @ApiProperty()
  @IsUUID()
  chemistId: string;

  @ApiPropertyOptional({ description: 'Link to an existing order' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Original bill/invoice number from physical bill (alphanumeric, unique)' })
  @IsOptional()
  @IsString()
  originalBillId?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @ApiPropertyOptional({ example: '2025-07-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
