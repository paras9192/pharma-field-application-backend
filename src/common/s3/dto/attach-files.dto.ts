import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_FILES_PER_REQUEST } from '../upload.constants';

export class UploadedFileRefDto {
  @ApiProperty({ description: 'S3 key returned by POST /uploads/presign', example: 'visits/ckx.../1720340000000-123456.jpg' })
  @IsString()
  @MaxLength(512)
  key: string;

  @ApiProperty({ description: 'Original filename on the device', example: 'IMG_2041.jpg' })
  @IsString()
  @MaxLength(255)
  filename: string;
}

export class AttachFilesDto {
  @ApiProperty({ type: [UploadedFileRefDto], description: 'Files already uploaded to S3 via presigned URLs' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_FILES_PER_REQUEST)
  @ValidateNested({ each: true })
  @Type(() => UploadedFileRefDto)
  files: UploadedFileRefDto[];
}

export class AttachFileDto {
  @ApiProperty({ description: 'S3 key returned by POST /uploads/presign', example: 'profile-photos/ckx.../1720340000000-123456.jpg' })
  @IsString()
  @MaxLength(512)
  key: string;
}
