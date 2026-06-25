-- DropForeignKey
ALTER TABLE "chemist_images" DROP CONSTRAINT "chemist_images_chemist_id_fkey";

-- DropForeignKey
ALTER TABLE "chemist_images" DROP CONSTRAINT "chemist_images_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "doctor_images" DROP CONSTRAINT "doctor_images_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_images" DROP CONSTRAINT "doctor_images_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "visit_images" DROP CONSTRAINT "visit_images_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "visit_images" DROP CONSTRAINT "visit_images_visit_id_fkey";

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "anniversary" DATE,
ADD COLUMN     "birthday" DATE;

-- AddForeignKey
ALTER TABLE "visit_images" ADD CONSTRAINT "visit_images_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_images" ADD CONSTRAINT "visit_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_images" ADD CONSTRAINT "doctor_images_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_images" ADD CONSTRAINT "doctor_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chemist_images" ADD CONSTRAINT "chemist_images_chemist_id_fkey" FOREIGN KEY ("chemist_id") REFERENCES "chemists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chemist_images" ADD CONSTRAINT "chemist_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
