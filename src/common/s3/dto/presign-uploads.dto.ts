import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ALLOWED_MIMETYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_REQUEST,
  UploadPurpose,
} from '../upload.constants';

export class PresignFileDto {
  @ApiProperty({ example: 'IMG_2041.jpg' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ example: 'image/jpeg' })
  @Matches(ALLOWED_MIMETYPES, {
    message: 'File type is not allowed. Accepted: images and PDFs.',
  })
  contentType: string;

  @ApiProperty({ description: 'Exact file size in bytes — signed into the URL, S3 rejects a mismatching PUT', example: 2048576 })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE, { message: 'File exceeds the 10 MB limit' })
  size: number;
}

export class PresignUploadsDto {
  @ApiProperty({ enum: UploadPurpose, example: UploadPurpose.VISITS })
  @IsEnum(UploadPurpose)
  purpose: UploadPurpose;

  @ApiProperty({ type: [PresignFileDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_FILES_PER_REQUEST)
  @ValidateNested({ each: true })
  @Type(() => PresignFileDto)
  files: PresignFileDto[];
}
