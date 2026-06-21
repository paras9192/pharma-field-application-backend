-- CreateTable
CREATE TABLE "sales_person_chemists" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "chemist_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_person_chemists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_person_chemists_user_id_chemist_id_key" ON "sales_person_chemists"("user_id", "chemist_id");

-- AddForeignKey
ALTER TABLE "sales_person_chemists" ADD CONSTRAINT "sales_person_chemists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_person_chemists" ADD CONSTRAINT "sales_person_chemists_chemist_id_fkey" FOREIGN KEY ("chemist_id") REFERENCES "chemists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_person_chemists" ADD CONSTRAINT "sales_person_chemists_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
