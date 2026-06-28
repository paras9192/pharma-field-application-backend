import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  mixin,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import multer, { MulterError } from 'multer';
import { S3Service } from './s3.service';

// Covers JPEG/PNG/WebP/HEIC from mobile cameras + PDF documents
const ALLOWED_MIMETYPES = /^(image\/(jpeg|jpg|png|webp|heic|heif|gif)|application\/(pdf|octet-stream))$/i;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const UPLOAD_TIMEOUT_MS = 60_000; // 60 s — enough for slow mobile connections

export function S3FilesInterceptor(folder: string, fieldName = 'files', maxFiles = 10) {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    constructor(public s3: S3Service) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Upload timed out — file too large or slow connection')),
          UPLOAD_TIMEOUT_MS,
        );

        multer({
          storage: this.s3.createStorage(folder),
          limits: { fileSize: MAX_FILE_SIZE, files: maxFiles },
          fileFilter: (_req, file, cb) => {
            if (ALLOWED_MIMETYPES.test(file.mimetype)) {
              cb(null, true);
            } else {
              cb(
                new UnsupportedMediaTypeException(
                  `File type "${file.mimetype}" is not allowed. Accepted: images and PDFs.`,
                ) as any,
                false,
              );
            }
          },
        }).array(fieldName, maxFiles)(req, res, (err) => {
          clearTimeout(timer);
          if (!err) return resolve();

          if (err instanceof MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return reject(new PayloadTooLargeException('File exceeds the 10 MB limit'));
            }
            return reject(new Error(err.message));
          }
          reject(err);
        });
      });

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}
