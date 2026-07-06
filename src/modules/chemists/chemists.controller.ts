import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
  Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { ChemistsService } from './chemists.service';
import { CreateChemistDto } from './dto/create-chemist.dto';
import { UpdateChemistDto } from './dto/update-chemist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { S3Service } from '../../common/s3/s3.service';
import { AttachFilesDto } from '../../common/s3/dto/attach-files.dto';
import { UploadPurpose } from '../../common/s3/upload.constants';

@ApiTags('Chemists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chemists')
export class ChemistsController {
  constructor(
    private chemistsService: ChemistsService,
    private s3: S3Service,
  ) {}

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

  @Post(':id/payment-reminder')
  @ApiOperation({ summary: 'Send payment reminder email to chemist for all outstanding bills' })
  sendPaymentReminder(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.chemistsService.sendPaymentReminder(id, currentUser);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Attach chemist images already uploaded to S3 (keys from POST /uploads/presign, purpose "chemists")' })
  async uploadImages(
    @Param('id') id: string,
    @Body() dto: AttachFilesDto,
    @CurrentUser() currentUser: any,
  ) {
    await this.s3.verifyUploads(UploadPurpose.CHEMISTS, currentUser.id, dto.files.map((f) => f.key));
    const mapped = dto.files.map((f) => ({ path: this.s3.urlForKey(f.key), filename: f.filename }));
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
