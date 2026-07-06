// Shared rules for the presigned-URL upload flow: the FE asks POST /uploads/presign
// for signed S3 PUT URLs, uploads directly to S3, then confirms the keys on the
// module endpoints (visits/bills/doctors/chemists/users) which save them to the DB.

/** S3 folder prefixes a client may request presigned URLs for. */
export enum UploadPurpose {
  VISITS = 'visits',
  BILLS = 'bills',
  DOCTORS = 'doctors',
  CHEMISTS = 'chemists',
  PROFILE_PHOTOS = 'profile-photos',
  EMPLOYEE_DOCUMENTS = 'employee-documents',
}

// Covers JPEG/PNG/WebP/HEIC from mobile cameras + PDF documents
export const ALLOWED_MIMETYPES = /^(image\/(jpeg|jpg|png|webp|heic|heif|gif)|application\/(pdf|octet-stream))$/i;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_REQUEST = 10;
export const PRESIGN_EXPIRY_SECONDS = 600; // FE must start the S3 PUT within 10 min
