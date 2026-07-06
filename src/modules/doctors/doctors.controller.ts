import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
  Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { S3Service } from '../../common/s3/s3.service';
import { AttachFilesDto } from '../../common/s3/dto/attach-files.dto';
import { UploadPurpose } from '../../common/s3/upload.constants';

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(
    private doctorsService: DoctorsService,
    private s3: S3Service,
  ) {}

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
  @ApiOperation({ summary: 'Attach doctor images already uploaded to S3 (keys from POST /uploads/presign, purpose "doctors")' })
  async uploadImages(
    @Param('id') id: string,
    @Body() dto: AttachFilesDto,
    @CurrentUser() currentUser: any,
  ) {
    await this.s3.verifyUploads(UploadPurpose.DOCTORS, currentUser.id, dto.files.map((f) => f.key));
    const mapped = dto.files.map((f) => ({ path: this.s3.urlForKey(f.key), filename: f.filename }));
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
