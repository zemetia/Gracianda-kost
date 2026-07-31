-- CreateEnum
CREATE TYPE "FacilityCategory" AS ENUM ('COMMON', 'ROOM');

-- AlterTable
ALTER TABLE "facilities" ADD COLUMN     "category" "FacilityCategory" NOT NULL DEFAULT 'ROOM';
