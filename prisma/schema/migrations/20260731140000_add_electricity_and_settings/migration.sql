-- CreateEnum
CREATE TYPE "ElectricityMode" AS ENUM ('FREE', 'TOKEN', 'METERED');

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "electricityMode" "ElectricityMode" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN "electricityMode" "ElectricityMode" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- AlterTable: rentAmount backfills from amountDue, which held rent only until now.
ALTER TABLE "payments" ADD COLUMN "rentAmount" DECIMAL(12,2);
UPDATE "payments" SET "rentAmount" = "amountDue" WHERE "rentAmount" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "rentAmount" SET NOT NULL;

ALTER TABLE "payments" ADD COLUMN "electricityKwh" DECIMAL(10,2);
ALTER TABLE "payments" ADD COLUMN "electricityRate" DECIMAL(12,2);
ALTER TABLE "payments" ADD COLUMN "electricityAmount" DECIMAL(12,2);
