-- AlterTable
ALTER TABLE "bills" ADD COLUMN "original_bill_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bills_original_bill_id_key" ON "bills"("original_bill_id");
