-- CreateEnum
CREATE TYPE "SettlementType" AS ENUM ('GOODS_RETURN', 'CREDIT_NOTE', 'DISCOUNT');

-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "bill_image_url" TEXT;

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "type" "SettlementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
