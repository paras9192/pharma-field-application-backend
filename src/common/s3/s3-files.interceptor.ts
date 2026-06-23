import { Injectable, NestInterceptor, ExecutionContext, CallHandler, mixin } from '@nestjs/common';
import { Observable } from 'rxjs';
import multer from 'multer';
import { S3Service } from './s3.service';

const ALLOWED_MIMETYPES = /^(image\/(jpeg|jpg|png|webp|heic|heif)|application\/pdf)$/i;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function S3FilesInterceptor(folder: string, fieldName = 'files', maxFiles = 10) {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
    constructor(public s3: S3Service) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();

      await new Promise<void>((resolve, reject) => {
        multer({
          storage: this.s3.createStorage(folder),
          limits: { fileSize: MAX_FILE_SIZE },
          fileFilter: (_req, file, cb) => {
            if (ALLOWED_MIMETYPES.test(file.mimetype)) cb(null, true);
            else cb(null, false);
          },
        }).array(fieldName, maxFiles)(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}
