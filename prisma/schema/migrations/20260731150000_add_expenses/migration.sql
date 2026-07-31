-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENOVATION', 'CLEANING', 'ELECTRICITY', 'WATER', 'WIFI_INTERNET', 'STAFF_SALARY', 'WASTE_MANAGEMENT', 'TAX_LICENSING', 'INSURANCE', 'SUPPLIES', 'MARKETING', 'OTHER');

-- AlterEnum
ALTER TYPE "AttachmentEntity" ADD VALUE 'EXPENSE';

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payee" TEXT,
    "note" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_propertyId_date_idx" ON "expenses"("propertyId", "date");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

