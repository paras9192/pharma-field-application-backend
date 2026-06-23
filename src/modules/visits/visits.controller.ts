import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
  Query, UploadedFiles, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const visitImageStorage = diskStorage({
  destination: './uploads/visits',
  filename: (_req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `visit-${suffix}${extname(file.originalname)}`);
  },
});

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
  @ApiOperation({ summary: 'Upload visit images (jpg/jpeg/png/webp, max 5 MB each, max 10 files)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: visitImageStorage,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: any,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    const invalid = files.filter((f) => !ALLOWED_IMAGE_TYPES.test(extname(f.originalname)));
    if (invalid.length > 0) throw new BadRequestException('Only JPG, JPEG, PNG, or WEBP files are allowed');

    const mapped = files.map((f) => ({ path: `/uploads/visits/${f.filename}`, filename: f.originalname }));
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
