import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export enum SettlementType {
  GOODS_RETURN = 'GOODS_RETURN',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DISCOUNT = 'DISCOUNT',
}

export class CreateSettlementDto {
  @ApiProperty({ description: 'Bill to apply settlement against' })
  @IsUUID()
  billId: string;

  @ApiProperty({ enum: SettlementType, description: 'Type of settlement' })
  @IsEnum(SettlementType)
  type: SettlementType;

  @ApiProperty({ description: 'Amount to reduce from the bill due' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: 'Reason / goods return description' })
  @IsOptional()
  @IsString()
  notes?: string;
}
