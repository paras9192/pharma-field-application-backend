-- Add location fields to doctors
ALTER TABLE "doctors"
  ADD COLUMN IF NOT EXISTS "latitude"              DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "longitude"             DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "location_captured_at"  TIMESTAMP(3);

-- Add location fields to chemists
ALTER TABLE "chemists"
  ADD COLUMN IF NOT EXISTS "latitude"              DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "longitude"             DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS "location_captured_at"  TIMESTAMP(3);

-- Add locationCapturedAt to visits
ALTER TABLE "visits"
  ADD COLUMN IF NOT EXISTS "location_captured_at"  TIMESTAMP(3);

-- Create visit_images table
CREATE TABLE IF NOT EXISTS "visit_images" (
  "id"           SERIAL       PRIMARY KEY,
  "visit_id"     TEXT         NOT NULL,
  "url"          TEXT         NOT NULL,
  "filename"     TEXT         NOT NULL,
  "uploaded_by"  TEXT         NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "visit_images_visit_id_fkey"     FOREIGN KEY ("visit_id")    REFERENCES "visits"("id")  ON DELETE CASCADE,
  CONSTRAINT "visit_images_uploaded_by_fkey"  FOREIGN KEY ("uploaded_by") REFERENCES "users"("id")
);

-- Create doctor_images table
CREATE TABLE IF NOT EXISTS "doctor_images" (
  "id"           SERIAL       PRIMARY KEY,
  "doctor_id"    TEXT         NOT NULL,
  "url"          TEXT         NOT NULL,
  "filename"     TEXT         NOT NULL,
  "uploaded_by"  TEXT         NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_images_doctor_id_fkey"    FOREIGN KEY ("doctor_id")   REFERENCES "doctors"("id")  ON DELETE CASCADE,
  CONSTRAINT "doctor_images_uploaded_by_fkey"  FOREIGN KEY ("uploaded_by") REFERENCES "users"("id")
);

-- Create chemist_images table
CREATE TABLE IF NOT EXISTS "chemist_images" (
  "id"           SERIAL       PRIMARY KEY,
  "chemist_id"   TEXT         NOT NULL,
  "url"          TEXT         NOT NULL,
  "filename"     TEXT         NOT NULL,
  "uploaded_by"  TEXT         NOT NULL,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chemist_images_chemist_id_fkey"  FOREIGN KEY ("chemist_id")  REFERENCES "chemists"("id") ON DELETE CASCADE,
  CONSTRAINT "chemist_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id")
);
