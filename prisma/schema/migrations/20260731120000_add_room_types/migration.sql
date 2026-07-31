-- AlterEnum
ALTER TYPE "AttachmentEntity" ADD VALUE IF NOT EXISTS 'ROOM_TYPE';

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "description" TEXT,
    "sizeSqm" DECIMAL(5,2),
    "price" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_types_propertyId_name_key" ON "room_types"("propertyId", "name");

-- CreateTable
CREATE TABLE "room_type_facilities" (
    "roomTypeId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,

    CONSTRAINT "room_type_facilities_pkey" PRIMARY KEY ("roomTypeId", "facilityId")
);

-- CreateTable
CREATE TABLE "room_type_prices" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "room_type_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_type_prices_roomTypeId_billingCycle_interval_key"
    ON "room_type_prices"("roomTypeId", "billingCycle", "interval");

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "roomTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_facilities" ADD CONSTRAINT "room_type_facilities_roomTypeId_fkey"
    FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_facilities" ADD CONSTRAINT "room_type_facilities_facilityId_fkey"
    FOREIGN KEY ("facilityId") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_prices" ADD CONSTRAINT "room_type_prices_roomTypeId_fkey"
    FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomTypeId_fkey"
    FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
