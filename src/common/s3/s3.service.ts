import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'path';
import { MAX_FILE_SIZE, PRESIGN_EXPIRY_SECONDS } from './upload.constants';

@Injectable()
export class S3Service {
  readonly client: S3Client;
  readonly bucket: string;
  readonly region: string;

  constructor(private config: ConfigService) {
    this.bucket = config.get<string>('AWS_S3_BUCKET')!;
    this.region = config.get<string>('AWS_REGION') ?? 'us-east-1';
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  // Keys are always generated server-side; the userId segment is what lets
  // verifyUploads() reject keys confirmed by anyone other than the uploader.
  generateKey(folder: string, userId: string, filename: string): string {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = extname(filename) || '.jpg';
    return `${folder}/${userId}/${suffix}${ext}`;
  }

  /**
   * Presigned PUT URL for direct browser→S3 upload. ContentType and
   * ContentLength are part of the signature, so the client must send the same
   * Content-Type header and a body of exactly the declared size.
   */
  presignPut(key: string, contentType: string, contentLength: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
      }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    );
  }

  /** Public object URL in the same format multer-s3 used to store, so old and new DB rows stay uniform. */
  urlForKey(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Confirm-step guard: each key must have been presigned for this folder and
   * user, actually exist in S3, and be within the size limit (backstop in case
   * the signed Content-Length was bypassed by a non-browser client).
   */
  async verifyUploads(folder: string, userId: string, keys: string[]): Promise<void> {
    await Promise.all(
      keys.map(async (key) => {
        if (!key.startsWith(`${folder}/${userId}/`) || key.includes('..')) {
          throw new BadRequestException(`Invalid file key: ${key}`);
        }
        let size: number;
        try {
          const head = await this.client.send(
            new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
          );
          size = head.ContentLength ?? 0;
        } catch {
          throw new BadRequestException(`File was not uploaded to storage: ${key}`);
        }
        if (size > MAX_FILE_SIZE) {
          await this.deleteObject(key).catch(() => undefined);
          throw new BadRequestException('File exceeds the 10 MB limit');
        }
      }),
    );
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
