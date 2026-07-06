import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { S3Service } from '../../common/s3/s3.service';
import { AttachFilesDto } from '../../common/s3/dto/attach-files.dto';
import { UploadPurpose } from '../../common/s3/upload.constants';

@ApiTags('Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bills')
export class BillsController {
  constructor(
    private billsService: BillsService,
    private s3: S3Service,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a bill — SA/Admin only. SP → 403, MR → 401' })
  create(@CurrentUser() currentUser: any, @Body() dto: CreateBillDto) {
    return this.billsService.create(currentUser.id, dto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'List bills' })
  @ApiQuery({ name: 'chemistId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['UNPAID', 'PARTIAL', 'PAID'] })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  findAll(
    @CurrentUser() currentUser: any,
    @Query() query: PaginationDto & { chemistId?: string; status?: string; from?: string; to?: string },
  ) {
    return this.billsService.findAll(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill details with payment history, settlements and images' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.billsService.findOne(id, currentUser);
  }

  @Post(':id/upload')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SALES_PERSON, Role.MR)
  @ApiOperation({ summary: 'Attach bill images / PDF scans already uploaded to S3 (keys from POST /uploads/presign, purpose "bills")' })
  async uploadBillImages(
    @Param('id') id: string,
    @Body() dto: AttachFilesDto,
    @CurrentUser() currentUser: any,
  ) {
    await this.s3.verifyUploads(UploadPurpose.BILLS, currentUser.id, dto.files.map((f) => f.key));
    const mapped = dto.files.map((f) => ({ path: this.s3.urlForKey(f.key), filename: f.filename }));
    return this.billsService.uploadBillImages(id, mapped, currentUser);
  }

  @Delete(':id/images/:imageId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SALES_PERSON, Role.MR)
  @ApiOperation({ summary: 'Delete a specific bill image' })
  deleteBillImage(
    @Param('id') id: string,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.billsService.deleteBillImage(id, imageId);
  }

  @Post('settlements')
  @Roles(Role.SALES_PERSON, Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Record a settlement (goods return, credit note, discount) against a bill' })
  createSettlement(@CurrentUser() currentUser: any, @Body() dto: CreateSettlementDto) {
    return this.billsService.createSettlement(currentUser.id, dto, currentUser);
  }

  @Get(':id/settlements')
  @ApiOperation({ summary: 'List all settlements for a bill' })
  getSettlements(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.billsService.getSettlements(id, currentUser);
  }
}
