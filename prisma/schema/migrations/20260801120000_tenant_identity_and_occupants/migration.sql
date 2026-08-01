-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');
CREATE TYPE "MaritalStatus" AS ENUM ('BELUM_MENIKAH', 'MENIKAH', 'CERAI');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "gender" "Gender";
ALTER TABLE "tenants" ADD COLUMN "birthPlace" TEXT;
ALTER TABLE "tenants" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN "maritalStatus" "MaritalStatus";
ALTER TABLE "tenants" ADD COLUMN "idAddress" TEXT;
ALTER TABLE "tenants" ADD COLUMN "institution" TEXT;
ALTER TABLE "tenants" ADD COLUMN "emergencyName" TEXT;
ALTER TABLE "tenants" ADD COLUMN "emergencyRelation" TEXT;
ALTER TABLE "tenants" ADD COLUMN "emergencyPhone" TEXT;

-- AlterTable
ALTER TABLE "contract_occupants" ADD COLUMN "gender" "Gender";
ALTER TABLE "contract_occupants" ADD COLUMN "phone" TEXT;
ALTER TABLE "contract_occupants" ADD COLUMN "ktpNumber" TEXT;
ALTER TABLE "contract_occupants" ADD COLUMN "occupation" TEXT;
ALTER TABLE "contract_occupants" ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "contract_occupants_contractId_idx" ON "contract_occupants"("contractId");
