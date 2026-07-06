import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
  Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { S3Service } from '../../common/s3/s3.service';
import { AttachFilesDto } from '../../common/s3/dto/attach-files.dto';
import { UploadPurpose } from '../../common/s3/upload.constants';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(
    private visitsService: VisitsService,
    private s3: S3Service,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Log a new visit' })
  create(@CurrentUser() currentUser: any, @Body() dto: CreateVisitDto) {
    return this.visitsService.create(currentUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List visits (filtered by role)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'visitType', required: false, enum: ['DOCTOR', 'CHEMIST'] })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'territoryId', required: false })
  @ApiQuery({ name: 'followUpPending', required: false })
  findAll(
    @CurrentUser() currentUser: any,
    @Query()
    query: PaginationDto & {
      userId?: string;
      visitType?: string;
      from?: string;
      to?: string;
      territoryId?: number;
      followUpPending?: string;
    },
  ) {
    return this.visitsService.findAll(query, currentUser);
  }

  @Get('follow-ups/pending')
  @ApiOperation({ summary: 'Get pending follow-up visits' })
  getPendingFollowUps(@CurrentUser() currentUser: any) {
    return this.visitsService.getPendingFollowUps(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit details' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.visitsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a visit (MR/Sales Person can only edit their own)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVisitDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.visitsService.update(id, dto, currentUser);
  }

  @Patch(':id/follow-up-done')
  @ApiOperation({ summary: 'Mark follow-up as done' })
  markFollowUpDone(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.visitsService.markFollowUpDone(id, currentUser);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Attach visit images already uploaded to S3 (keys from POST /uploads/presign, purpose "visits")' })
  async uploadImages(
    @Param('id') id: string,
    @Body() dto: AttachFilesDto,
    @CurrentUser() currentUser: any,
  ) {
    await this.s3.verifyUploads(UploadPurpose.VISITS, currentUser.id, dto.files.map((f) => f.key));
    const mapped = dto.files.map((f) => ({ path: this.s3.urlForKey(f.key), filename: f.filename }));
    return this.visitsService.uploadImages(id, mapped, currentUser);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a visit image' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.visitsService.deleteImage(id, imageId, currentUser);
  }
}
