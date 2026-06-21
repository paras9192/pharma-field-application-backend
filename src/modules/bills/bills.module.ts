import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { ChemistsModule } from '../chemists/chemists.module';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads/bills' }),
    ChemistsModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
