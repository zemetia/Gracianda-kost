-- AlterTable
ALTER TABLE "rooms" RENAME COLUMN "sizeSqm" TO "lengthM";
ALTER TABLE "rooms" ADD COLUMN "widthM" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "room_types" RENAME COLUMN "sizeSqm" TO "lengthM";
ALTER TABLE "room_types" ADD COLUMN "widthM" DECIMAL(5,2);

-- Data fix: previous sizeSqm was a total area, not a dimension — split
-- existing seed rows into explicit length x width so they stay meaningful.
UPDATE "rooms" SET "lengthM" = 3, "widthM" = 4 WHERE "number" IN ('101', '102');
UPDATE "rooms" SET "lengthM" = 3, "widthM" = 5 WHERE "number" = '201';
