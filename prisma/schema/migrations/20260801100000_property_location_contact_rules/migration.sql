-- CreateEnum
CREATE TYPE "GenderPolicy" AS ENUM ('PUTRA', 'PUTRI', 'CAMPUR');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "district" TEXT;
ALTER TABLE "properties" ADD COLUMN "city" TEXT;
ALTER TABLE "properties" ADD COLUMN "province" TEXT;
ALTER TABLE "properties" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "properties" ADD COLUMN "latitude" DECIMAL(10,7);
ALTER TABLE "properties" ADD COLUMN "longitude" DECIMAL(10,7);
ALTER TABLE "properties" ADD COLUMN "mapsUrl" TEXT;
ALTER TABLE "properties" ADD COLUMN "contactName" TEXT;
ALTER TABLE "properties" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "properties" ADD COLUMN "whatsappNumber" TEXT;
ALTER TABLE "properties" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "properties" ADD COLUMN "genderPolicy" "GenderPolicy" NOT NULL DEFAULT 'CAMPUR';
ALTER TABLE "properties" ADD COLUMN "curfewTime" TEXT;
ALTER TABLE "properties" ADD COLUMN "rules" TEXT;
