import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

const ALLOWED_TYPES = /\.(jpg|jpeg|png|pdf|webp)$/i;

const billImageStorage = diskStorage({
  destination: './uploads/bills',
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `bill-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bills')
export class BillsController {
  constructor(private billsService: BillsService) {}

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
  @ApiOperation({ summary: 'Upload one or more bill images / PDF scans (max 10 files, 10 MB each)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: billImageStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadBillImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: any,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');

    const invalid = files.filter((f) => !ALLOWED_TYPES.test(extname(f.originalname)));
    if (invalid.length > 0) {
      throw new BadRequestException('Only JPG, PNG, PDF, or WEBP files are allowed');
    }

    const mapped = files.map((f) => ({
      path: `/uploads/bills/${f.filename}`,
      filename: f.originalname,
    }));

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
