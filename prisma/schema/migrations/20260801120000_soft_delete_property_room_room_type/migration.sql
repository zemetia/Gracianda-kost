-- Soft delete for Property / Room / RoomType.
-- `isActive = false` stays "parked" (visible behind the admin's Nonaktif
-- filter); `deletedAt` is permanent removal from every list and picker.
ALTER TABLE "properties" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "rooms" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "room_types" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Every list filters on deletedAt IS NULL, so the index carries the whole
-- visible set rather than the (tiny) deleted one.
CREATE INDEX "properties_deletedAt_idx" ON "properties" ("deletedAt");
CREATE INDEX "rooms_deletedAt_idx" ON "rooms" ("deletedAt");
CREATE INDEX "room_types_deletedAt_idx" ON "room_types" ("deletedAt");
