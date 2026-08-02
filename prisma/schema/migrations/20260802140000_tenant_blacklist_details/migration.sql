-- Blacklist penyewa: dari satu flag + catatan bebas menjadi entri yang bisa
-- dipertanggungjawabkan (kategori, sejak kapan, oleh siapa).
CREATE TYPE "BlacklistReason" AS ENUM ('TUNGGAKAN', 'KERUSAKAN', 'PELANGGARAN', 'KEAMANAN', 'LAINNYA');

ALTER TABLE "tenants" ADD COLUMN "blacklistReason" "BlacklistReason";
ALTER TABLE "tenants" ADD COLUMN "blacklistedAt" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN "blacklistedById" TEXT;

-- Baris lama sudah ditandai blacklist tapi tidak punya tanggal. Diisi
-- `updatedAt` — perkiraan terbaik yang benar-benar ada di data, bukan now()
-- yang akan berbohong bahwa semuanya diblacklist hari migrasi dijalankan.
-- Kategorinya sengaja dibiarkan NULL: menebaknya jadi TUNGGAKAN akan menuduh.
UPDATE "tenants" SET "blacklistedAt" = "updatedAt" WHERE "isBlacklisted" = true AND "blacklistedAt" IS NULL;

-- SET NULL, bukan RESTRICT: admin yang keluar tidak boleh mengunci penghapusan
-- akunnya, dan entri blacklist-nya tetap sah tanpa nama pembuatnya.
ALTER TABLE "tenants"
  ADD CONSTRAINT "tenants_blacklistedById_fkey"
  FOREIGN KEY ("blacklistedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Halaman blacklist selalu memfilter kolom ini.
CREATE INDEX "tenants_isBlacklisted_idx" ON "tenants" ("isBlacklisted");
