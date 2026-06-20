import { Module } from '@nestjs/common';
import { ChemistsService } from './chemists.service';
import { ChemistsController } from './chemists.controller';

@Module({
  controllers: [ChemistsController],
  providers: [ChemistsService],
  exports: [ChemistsService],
})
export class ChemistsModule {}
