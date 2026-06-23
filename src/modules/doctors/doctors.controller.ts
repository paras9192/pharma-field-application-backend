import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
  Query, UploadedFiles, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const doctorImageStorage = diskStorage({
  destination: './uploads/doctors',
  filename: (_req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `doctor-${suffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new doctor' })
  create(@Body() dto: CreateDoctorDto, @CurrentUser() currentUser: any) {
    return this.doctorsService.create(dto, currentUser.id);
  }

  @Get()
  @ApiOperation({ summary: 'List doctors with search and filters' })
  findAll(@Query() query: PaginationDto & { territoryId?: number; isActive?: string }) {
    return this.doctorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor details' })
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update doctor details (MR/Sales Person can only edit their own records)' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @CurrentUser() currentUser: any) {
    return this.doctorsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a doctor' })
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload doctor images (jpg/jpeg/png/webp, max 5 MB each, max 10 files)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: doctorImageStorage,
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

    const mapped = files.map((f) => ({ path: `/uploads/doctors/${f.filename}`, filename: f.originalname }));
    return this.doctorsService.uploadImages(id, mapped, currentUser);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a doctor image' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.doctorsService.deleteImage(id, imageId, currentUser);
  }
}
