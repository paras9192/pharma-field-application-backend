import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
  Query, UploadedFiles, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { S3FilesInterceptor } from '../../common/s3/s3-files.interceptor';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private visitsService: VisitsService) {}

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
  @ApiOperation({ summary: 'Upload visit images to S3 (jpg/png/webp/heic, max 10 MB each, max 10 files)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @UseInterceptors(S3FilesInterceptor('visits', 'files', 10))
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: any,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    const mapped = files.map((f: any) => ({ path: f.location, filename: f.originalname }));
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
