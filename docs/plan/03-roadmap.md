# Roadmap

← [02-modules-features.md](./02-modules-features.md) | [Plan Index](./README.md)

---

Fase disusun berdasarkan dependency, bukan tanggal. Fase N tidak bisa mulai sebelum Fase N-1 selesai karena data model / infra bergantung. Melanjutkan dari `docs/tasks/2026-06-11.txt` (item 1: Prisma, item 2: Auth) — dua item itu jadi **Fase 0**, sudah punya fondasi (schema `User`/`Account`/`Session` + `next-auth` di `package.json`), tinggal diselesaikan.

---

## Fase 0 — Fondasi (Prisma + Auth) ✅ selesai

- [x] Extend `UserRole` enum di [user.prisma](../../prisma/schema/user.prisma) → `SUPER_ADMIN | OPERASIONAL | KEUANGAN | SECURITY`
- [x] `requireRole()` mendukung multi-role (`requireRole(['SUPER_ADMIN', 'KEUANGAN'])`) — [src/lib/auth.ts](../../src/lib/auth.ts)
- [x] Login Credentials-only (Google OAuth ditunda, bisa ditambah belakangan tanpa migrasi besar) — [src/app/[locale]/sign-in/](../../src/app/%5Blocale%5D/sign-in/)
- [x] Admin shell dengan sidebar role-based + guard — [src/app/[locale]/admin/layout.tsx](../../src/app/%5Blocale%5D/admin/layout.tsx)
- [x] Seed script (`prisma/seed.ts`) — satu `SUPER_ADMIN`, email/password lewat `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`
- [ ] Setup database dev (Postgres — Neon/Supabase/lokal) + isi `DATABASE_URL` di `.env.local` — **blocker sebelum `db:migrate`/`db:seed` bisa jalan**, keputusan infra di tangan kamu
- [ ] `npm run db:migrate` untuk baseline migration (jalankan setelah `DATABASE_URL` terisi)
- [ ] `npm run db:seed`

---

## Fase 1 — Master Data & Denah Kamar (MVP tampil) ✅ kode selesai, nunggu DB

- [x] `prisma/schema/property.prisma` (Floor, Room, Facility, RoomFacility, Promo)
- [x] `prisma/schema/attachment.prisma` — Fase 1 pakai **local disk** (`public/uploads/`), swap ke object storage cloud belakangan tanpa ubah shape `url`
- [x] Service layer: `roomService`, `facilityService`, `promoService`, `attachmentService` (admin, Prisma langsung — lihat catatan arsitektur di bawah) + `publicRoomService`, `publicPromoService` (publik, field terbatas)
- [x] Admin CRUD: `/admin/master-data/rooms` (+ `/new`, `/[id]` dengan upload foto/video), `/facilities`, `/promos`
- [x] Halaman publik: Beranda (hero, fasilitas umum, promo, lokasi, kontak) + Denah Kamar Interaktif (klik kamar → modal detail, bukan hover)
- [x] `buildMetadata()` + JSON-LD (`organizationSchema` + `webPageSchema`) di halaman publik
- [x] `npm run lint`, `type-check`, `build`, `test:run` semua hijau

**Catatan arsitektur (deviasi terdokumentasi):** service domain yang Prisma-backed (`room.service.ts`, dst.) **tidak** memakai pola `apiClient` dari [SERVICES.md](../blueprint/SERVICES.md) — pola itu untuk konsumsi API eksternal. Service domain internal memanggil `prisma` langsung dan hanya boleh diimpor dari Server Component/Server Action, tidak diekspor lewat barrel `src/services/index.ts` supaya tidak tidak sengaja ke-import Client Component.

**Yang masih perlu kamu lakukan sebelum modul ini benar-benar hidup:**
1. Isi `DATABASE_URL` di `.env.local` (lihat `.env.example`)
2. `npm run db:migrate` lalu `npm run db:seed`
3. Login ke `/sign-in` dengan `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (default `admin@graciandahouse.com` / `ChangeMe123!` kalau env tidak diisi — **ganti password ini**)
4. Tambah lantai + kamar pertama dari `/admin/master-data/rooms` supaya denah publik tidak kosong
5. Ganti placeholder di [src/config/site.ts](../../src/config/site.ts): `whatsappNumber`, `contactPhone`, `address`, `mapEmbedUrl`

**Nilai bisnis:** website publik bisa live dan dipakai untuk promosi begitu DB tersambung, meski modul operasional (penyewa/pembayaran) belum jadi.

---

## Fase 2 — Penyewa, Kontrak, Status Kamar Dinamis ✅ selesai

- [x] `prisma/schema/tenant.prisma` (Tenant, Contract, ContractOccupant, ContractSequence)
- [x] Generate `contractCode` (`GH-YYNNNN`) atomik via `UPSERT ... RETURNING` pada tabel `ContractSequence` per tahun — deviasi dari rencana awal ("native Postgres sequence per tahun"): sama-sama race-safe, tapi tidak butuh migration SQL dinamis yang membuat sequence object baru tiap pergantian tahun. Lihat [contract.service.ts](../../src/services/contract.service.ts)
- [x] `tenantService`, `contractService` — validasi "satu kamar satu contract aktif" + auto-close contract lama saat tenant existing pindah/sewa ulang, dalam transaction yang sama
- [x] Server Action: `createContractAction` (menangani sewa baru & pindah/sewa ulang lewat satu form dengan toggle), `closeContractAction`, `setBlacklistAction`, `uploadKtpAction`
- [x] `roomService`/`publicRoomService` — status kamar sekarang derived dari `Contract` aktif (diverifikasi lewat smoke test: create contract → kamar terisi → close contract → kamar tersedia lagi)
- [x] Admin: `/admin/tenants` (search), `/admin/tenants/[id]` (riwayat kontrak + blacklist + upload KTP), `/admin/contracts` (list), `/admin/contracts/new` (wizard sewa baru/pindah/sewa ulang), `/admin/contracts/[id]` (detail + tutup kontrak)
- [x] `AuditLog` dicatat untuk create/close contract
- [x] Guard role di level layout (`/admin/tenants`, `/admin/contracts` → `SUPER_ADMIN|OPERASIONAL|KEUANGAN`; mutasi tetap dibatasi `SUPER_ADMIN|OPERASIONAL` di Server Action)
- [x] `npm run lint`, `type-check`, `build`, `test:run` hijau + smoke test end-to-end ke DB asli

**Nilai bisnis:** ini titik di mana sistem mulai menggantikan pencatatan manual admin untuk data penyewa — dependency untuk hampir semua modul setelah ini.

---

## Fase 3 — Pembayaran ✅ kode selesai, nunggu DB

Dependency: Fase 2 (butuh `Contract`).

- [x] `prisma/schema/payment.prisma` — status **derived** (bukan disimpan), lihat komentar di model
- [x] `paymentService` — termasuk fungsi status derivation (`getPaymentStatus`) + `generateMonthlyInvoices` idempotent (`skipDuplicates` + `@@unique([contractId, periodMonth, periodYear])`)
- [x] Generate tagihan bulanan — tombol manual admin (`GenerateInvoicesForm`); cron via `scheduled-tasks` skill belum dipasang, opsional belakangan
- [x] Server Action: `markAsPaidAction`, `addPartialPaymentAction` (`requireRole(['SUPER_ADMIN','KEUANGAN'])`) + `AuditLog` tercatat
- [x] `src/lib/whatsapp.ts` — `buildReminderMessage`, `buildWaLink` + tombol "Kirim WA" (`SendWaButton`) muncul saat status DUE/OVERDUE
- [x] Admin: `/admin/payments` (list + filter status/bulan/tahun), `/admin/payments/[id]` (detail + tambah pembayaran parsial + tandai lunas)
- [x] `roomService.getRoomHistory()` — `totalIncome` di-wire ke `SUM(Payment.amountPaid)` per kamar (sebelumnya stub `0` di Fase 4)
- [x] Migration `20260714094439_add_payment` sudah dibuat
- [x] `npm run lint`, `type-check`, `test:run` semua hijau

**Yang masih perlu kamu lakukan sebelum modul ini benar-benar hidup:** sama seperti Fase 1/4/5 — isi `DATABASE_URL`, `npm run db:migrate` (migration sudah ada, tinggal apply), lalu smoke test manual: generate tagihan → tandai lunas → cek status berubah di list.

**Nilai bisnis:** ini modul dengan ROI tertinggi menurut kamu sendiri — sudah landing duluan begitu Fase 2 selesai, sesuai prioritas.

---

## Fase 4 — Maintenance & Insiden ✅ kode selesai, nunggu DB

Dependency: Fase 1 (butuh `Room`); tidak bergantung ke Fase 2/3, bisa paralel dengan Fase 3 kalau ada dua developer.

- [x] `prisma/schema/maintenance.prisma`, `prisma/schema/incident.prisma`
- [x] `maintenanceService`, `incidentService`
- [x] Admin: `/admin/maintenance` (list + filter scope/lantai/tanggal + form baru dengan datalist kategori), `/admin/incidents` (list + filter kategori/status/lantai + form baru + detail dengan ubah status)
- [x] Riwayat kamar (§5) — `roomService.getRoomHistory()` gabungkan contract + maintenance, ditampilkan di `/admin/master-data/rooms/[id]`. `totalIncome` sekarang di-wire ke `SUM(Payment.amountPaid)` (Fase 3 sudah landing).
- [x] Guard role: layout `/admin/maintenance` → `SUPER_ADMIN|OPERASIONAL|KEUANGAN` (mutasi `SUPER_ADMIN|OPERASIONAL`); `/admin/incidents` → `SUPER_ADMIN|SECURITY|OPERASIONAL` (create `SUPER_ADMIN|SECURITY|OPERASIONAL`, ubah status `SUPER_ADMIN|SECURITY` only)
- [x] `AuditLog` dicatat untuk create maintenance/incident + update status insiden
- [x] `npm run lint`, `type-check` hijau

**Yang masih perlu dilakukan:** jalankan `npm run db:migrate` begitu `DATABASE_URL` aktif (Docker Desktop belum jalan saat ini) untuk membuat migration `maintenance_records`/`incidents`, lalu smoke test manual di browser.

---

## Fase 5 — Dashboard & Laporan ✅ kode selesai, nunggu DB

Dependency: Fase 2, 3, 4 (butuh semua data ada untuk agregat berarti).

- [x] Widget dashboard (`dashboardService` — okupansi, pendapatan bulan ini, overdue, maintenance bulan ini, insiden bulan ini by status, tren pendapatan 6 bulan)
- [x] Grafik — native SVG bar chart (`RevenueChart.tsx`), bukan `recharts` — cukup sederhana (1 seri, 6 titik) untuk tidak butuh dependency tambahan
- [x] 4 halaman laporan (`reportService` + `ReportFilterBar` reusable): `/admin/reports/financial`, `/admin/reports/tenants`, `/admin/reports/maintenance`, `/admin/reports/incidents` — filter tanggal (dari/sampai) + lantai, maintenance tambah filter scope
- [x] Role-based content filtering di dashboard (widget keuangan → SUPER_ADMIN/KEUANGAN, maintenance → +OPERASIONAL, insiden → SUPER_ADMIN/SECURITY/OPERASIONAL) dan di tiap halaman laporan (`requireRole`) sesuai matriks akses di [02-modules-features.md](./02-modules-features.md)
- [x] Print-friendly — tombol "Cetak" (`window.print()`) + `print:hidden` pada sidebar dan filter bar (Tailwind v4 `print:` variant, tidak perlu CSS tambahan)
- [x] `npm run lint`, `type-check` hijau

**Catatan:** filter laporan pakai rentang tanggal bebas (dari/sampai), bukan dropdown periode harian/mingguan/bulanan/tahunan — konsisten dengan pola filter yang sudah ada di `/admin/maintenance` dan `/admin/incidents`, dan tetap mencakup semua kebutuhan filter periode.

---

## Fase 6 — Role & Permission Refinement + Audit Log Viewer ✅ selesai

Dependency: semua fase sebelumnya sudah pakai `requireRole()` secara konsisten.

- [x] Audit trail lengkap di semua Server Action mutasi — 11 aksi dari Fase 1-3 yang sebelumnya tidak menulis `AuditLog` sudah dilengkapi: `createFloor`, `uploadRoomPhoto`, `removeRoomPhoto`, `createFacility`, `removeFacility`, `createPromo`, `removePromo`, `setBlacklist`, `uploadKtp`, `uploadContractDoc`, `uploadPaymentProof`
- [x] Halaman `/admin/audit-log` (SUPER_ADMIN only) — filter entitas/pengguna/aksi/rentang tanggal, paginasi 50 baris, diff before/after sebagai JSON viewer `<details>` (tetap Server Component, tanpa JS klien)
- [x] Manajemen user (`/admin/users` + `/admin/users/[id]`) — create, edit (nama/email/role/ganti password), aktif/nonaktif; SUPER_ADMIN only
- [x] **403 bukan crash** — `requireRole()` yang throw hanya dipakai di Server Action. Halaman/layout admin sekarang pakai `canAccess()` (non-throwing) + komponen `<Forbidden />`, jadi role yang tidak berhak melihat layar "403 — Akses Ditolak" di dalam admin shell, bukan error boundary
- [x] Guard yang sebelumnya bolong: `/admin/master-data/*` tidak punya layout guard sama sekali (semua role bisa buka list kamar/fasilitas/promo, hanya mutasinya yang dijaga) — sekarang ada `master-data/layout.tsx` → `SUPER_ADMIN|OPERASIONAL`
- [x] Soft delete user (`User.isActive`, migration `20260726090000_add_user_is_active`) — hard delete tidak mungkin karena `AuditLog.userId` FK restrict, dan menghapus user akan memutus jejak audit. User nonaktif ditolak saat login di `src/auth.ts`
- [x] Proteksi kunci: tidak bisa menonaktifkan/menurunkan role Super Admin aktif terakhir, dan tidak bisa menurunkan role atau menonaktifkan akun sendiri
- [x] `npm run lint`, `type-check`, `test:run` hijau + smoke test service ke DB asli (create/update/soft-delete user, hash password, guard super admin terakhir, filter & paginasi audit log)

**Catatan:** password tidak pernah masuk `AuditLog` — yang dicatat hanya flag `passwordChanged: true`.

---

## Fase Lanjutan (Backlog, belum prioritas)

- WhatsApp Cloud API — reminder otomatis terjadwal tanpa klik admin (butuh verifikasi Meta Business + nomor dedicated)
- Kalender okupansi visual
- Payment gateway (Midtrans/Xendit) — upgrade dari transfer manual + bukti
- Export laporan ke Excel/PDF
- Multi-property / multi-building
- Pengingat masa sewa berakhir sebagai notifikasi terjadwal (bukan cuma widget dashboard)

---

## Infra & Keputusan Prasyarat (blocker sebelum coding, bukan sesudah)

1. **Object storage** untuk `Attachment` — pilih sebelum Fase 1 (Cloudflare R2 / Supabase Storage / UploadThing). Tanpa ini, upload foto kamar/KTP/bukti pembayaran tidak bisa jalan sama sekali.
2. **Hosting database** — Neon / Supabase Postgres / self-hosted, sebelum Fase 0 selesai.
3. **Deployment target** — Vercel (paling natural untuk Next.js 16 + Turbopack) atau lainnya — mempengaruhi setup `AUTH_URL`, env vars production.

Jawaban ketiga poin ini menentukan berapa banyak "setup infra" vs "coding fitur" di Fase 0-1.

← [02-modules-features.md](./02-modules-features.md) | [Plan Index](./README.md)
