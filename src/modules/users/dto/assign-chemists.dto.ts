import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AssignChemistsDto {
  @ApiProperty({ type: [String], description: 'Chemist IDs to assign to the sales person' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  chemistIds: string[];
}
