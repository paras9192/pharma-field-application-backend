import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { S3Service } from './s3.service';
import { PresignUploadsDto } from './dto/presign-uploads.dto';
import { PRESIGN_EXPIRY_SECONDS } from './upload.constants';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private s3: S3Service) {}

  @Post('presign')
  @ApiOperation({
    summary:
      'Get presigned S3 PUT URLs for direct upload (max 10 files, 10 MB each). ' +
      'PUT each file to its url with the same Content-Type, then confirm the keys on the module endpoint.',
  })
  async presign(@CurrentUser('id') userId: string, @Body() dto: PresignUploadsDto) {
    const files = await Promise.all(
      dto.files.map(async (f) => {
        const key = this.s3.generateKey(dto.purpose, userId, f.filename);
        const url = await this.s3.presignPut(key, f.contentType, f.size);
        return { key, url };
      }),
    );
    return { expiresIn: PRESIGN_EXPIRY_SECONDS, files };
  }
}
