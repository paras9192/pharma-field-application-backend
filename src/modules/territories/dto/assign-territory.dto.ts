import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignTerritoryDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  territoryId: number;
}
