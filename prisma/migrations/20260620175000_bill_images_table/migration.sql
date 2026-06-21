-- AlterTable: drop bill_image_url, add bill_images relation already handled by new model
ALTER TABLE "bills" DROP COLUMN IF EXISTS "bill_image_url";

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SettlementType" AS ENUM ('GOODS_RETURN', 'CREDIT_NOTE', 'DISCOUNT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "bill_images" (
    "id" SERIAL NOT NULL,
    "bill_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bill_images" ADD CONSTRAINT "bill_images_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_images" ADD CONSTRAINT "bill_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
