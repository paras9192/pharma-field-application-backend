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
import { ChemistsService } from './chemists.service';
import { CreateChemistDto } from './dto/create-chemist.dto';
import { UpdateChemistDto } from './dto/update-chemist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const chemistImageStorage = diskStorage({
  destination: './uploads/chemists',
  filename: (_req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `chemist-${suffix}${extname(file.originalname)}`);
  },
});

@ApiTags('Chemists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chemists')
export class ChemistsController {
  constructor(private chemistsService: ChemistsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new chemist/customer' })
  create(@Body() dto: CreateChemistDto, @CurrentUser() currentUser: any) {
    return this.chemistsService.create(dto, currentUser.id);
  }

  @Get()
  @ApiOperation({ summary: 'List chemists (SALES_PERSON sees only their assigned chemists)' })
  findAll(
    @Query() query: PaginationDto & { territoryId?: number; isActive?: string },
    @CurrentUser() currentUser: any,
  ) {
    return this.chemistsService.findAll(query, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chemist details' })
  findOne(@Param('id') id: string) {
    return this.chemistsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update chemist details (MR/Sales Person can only edit their own records)' })
  update(@Param('id') id: string, @Body() dto: UpdateChemistDto, @CurrentUser() currentUser: any) {
    return this.chemistsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a chemist' })
  remove(@Param('id') id: string) {
    return this.chemistsService.remove(id);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload chemist images (jpg/jpeg/png/webp, max 5 MB each, max 10 files)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: chemistImageStorage,
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

    const mapped = files.map((f) => ({ path: `/uploads/chemists/${f.filename}`, filename: f.originalname }));
    return this.chemistsService.uploadImages(id, mapped, currentUser);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a chemist image' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() currentUser: any,
  ) {
    return this.chemistsService.deleteImage(id, imageId, currentUser);
  }
}
