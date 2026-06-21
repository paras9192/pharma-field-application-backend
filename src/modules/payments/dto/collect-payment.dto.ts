import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export enum PaymentMode {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  UPI = 'UPI',
  NEFT = 'NEFT',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CollectPaymentDto {
  @ApiProperty()
  @IsUUID()
  billId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentMode })
  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;

  @ApiPropertyOptional({ description: 'Cheque number / UPI ref / NEFT ref' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
