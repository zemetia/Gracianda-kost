-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('KOST', 'HOUSE', 'APARTMENT', 'VILLA', 'OTHER');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('PELANGGARAN_ATURAN', 'GANGGUAN', 'KERUSAKAN', 'KEHILANGAN', 'KELUHAN_PENGHUNI', 'LAPORAN_SECURITY');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MaintenanceScope" AS ENUM ('ROOM', 'BUILDING');

-- ============================================================
-- SECTION 1: Properties table
-- ============================================================
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "type" "PropertyType" NOT NULL DEFAULT 'KOST',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "properties_name_key" ON "properties"("name");
CREATE UNIQUE INDEX "properties_code_key" ON "properties"("code");

-- ============================================================
-- SECTION 2: Floors — add propertyId
-- ============================================================
ALTER TABLE "floors" ADD COLUMN "propertyId" TEXT;

-- Backfill: insert default property and assign all existing floors to it
DO $$
DECLARE
    default_property_id TEXT;
BEGIN
    default_property_id := encode(gen_random_bytes(12), 'base64');
    -- Use a fixed ID so we can reference it below
    default_property_id := 'gracianda_default';
    INSERT INTO "properties" ("id", "name", "code", "type", "isActive", "createdAt", "updatedAt")
    VALUES (default_property_id, 'Gracianda House', 'GH', 'KOST', true, NOW(), NOW())
    ON CONFLICT ("name") DO NOTHING;
    UPDATE "floors" SET "propertyId" = default_property_id WHERE "propertyId" IS NULL;
END $$;

ALTER TABLE "floors" ALTER COLUMN "propertyId" SET NOT NULL;
ALTER TABLE "floors" ADD CONSTRAINT "floors_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- SECTION 3: Rooms — add propertyId, make floorId nullable
-- ============================================================
ALTER TABLE "rooms" ADD COLUMN "propertyId" TEXT;

-- Backfill rooms via their floor's propertyId
UPDATE "rooms" r
SET "propertyId" = f."propertyId"
FROM "floors" f
WHERE r."floorId" = f."id";

-- Any rooms not yet assigned (no floor): assign to default property
UPDATE "rooms"
SET "propertyId" = 'gracianda_default'
WHERE "propertyId" IS NULL;

ALTER TABLE "rooms" ALTER COLUMN "propertyId" SET NOT NULL;
ALTER TABLE "rooms" ALTER COLUMN "floorId" DROP NOT NULL;

-- Drop old unique index on number alone
DROP INDEX IF EXISTS "rooms_number_key";

-- New composite unique on (propertyId, number)
CREATE UNIQUE INDEX "rooms_propertyId_number_key" ON "rooms"("propertyId", "number");

ALTER TABLE "rooms" ADD CONSTRAINT "rooms_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fix floorId FK: it was NOT NULL before, re-add as nullable FK
ALTER TABLE "rooms" DROP CONSTRAINT IF EXISTS "rooms_floorId_fkey";
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floorId_fkey"
    FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- SECTION 4: RoomPrices — new table
-- ============================================================
CREATE TABLE "room_prices" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "room_prices_roomId_billingCycle_interval_key"
    ON "room_prices"("roomId", "billingCycle", "interval");

ALTER TABLE "room_prices" ADD CONSTRAINT "room_prices_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: seed a MONTHLY price from existing Room.price for every room
INSERT INTO "room_prices" ("id", "roomId", "billingCycle", "interval", "price", "isActive", "createdAt", "updatedAt")
SELECT
    concat('rp_', substr(md5(random()::TEXT || "id"), 1, 20)),
    "id",
    'MONTHLY',
    1,
    "price",
    true,
    NOW(),
    NOW()
FROM "rooms"
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECTION 5: Contracts — add billingCycle and billingInterval
-- ============================================================
ALTER TABLE "contracts"
    ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    ADD COLUMN "billingInterval" INTEGER NOT NULL DEFAULT 1;

-- ============================================================
-- SECTION 6: ContractSequences — add propertyId, change PK
-- ============================================================
ALTER TABLE "contract_sequences" ADD COLUMN "propertyId" TEXT;

-- Backfill
UPDATE "contract_sequences"
SET "propertyId" = 'gracianda_default'
WHERE "propertyId" IS NULL;

ALTER TABLE "contract_sequences" ALTER COLUMN "propertyId" SET NOT NULL;

-- Drop old PK, add new composite PK
ALTER TABLE "contract_sequences" DROP CONSTRAINT IF EXISTS "contract_sequences_pkey";
ALTER TABLE "contract_sequences" ADD CONSTRAINT "contract_sequences_pkey"
    PRIMARY KEY ("propertyId", "year");

-- ============================================================
-- SECTION 7: Incidents table (new)
-- ============================================================
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "date" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "incidents_roomId_date_idx" ON "incidents"("roomId", "date");
CREATE INDEX "incidents_status_idx" ON "incidents"("status");
CREATE INDEX "incidents_propertyId_idx" ON "incidents"("propertyId");

ALTER TABLE "incidents" ADD CONSTRAINT "incidents_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- SECTION 8: MaintenanceRecords table (new)
-- ============================================================
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "scope" "MaintenanceScope" NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(12,2),
    "vendor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "maintenance_records_roomId_date_idx" ON "maintenance_records"("roomId", "date");
CREATE INDEX "maintenance_records_propertyId_idx" ON "maintenance_records"("propertyId");

ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
