import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { extname } from 'path';

@Injectable()
export class S3Service {
  readonly client: S3Client;
  readonly bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = config.get<string>('AWS_S3_BUCKET')!;
    this.client = new S3Client({
      region: config.get<string>('AWS_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  createStorage(folder: string) {
    return multerS3({
      s3: this.client,
      bucket: this.bucket,
      contentType: (_req, file, cb) => cb(null, file.mimetype || 'application/octet-stream'),
      key: (_req, file, cb) => {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext = extname(file.originalname) || '.jpg';
        cb(null, `${folder}/${suffix}${ext}`);
      },
    });
  }

  extractKey(url: string): string {
    try {
      return new URL(url).pathname.slice(1);
    } catch {
      return url;
    }
  }

  async deleteObject(url: string): Promise<void> {
    const key = this.extractKey(url);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
