# Task Breakdown — UI/UX, Frontend, Backend, Infra

← [03-roadmap.md](./03-roadmap.md) | [Plan Index](./README.md)

---

Breakdown taktis dari [03-roadmap.md](./03-roadmap.md), dipecah per disiplin supaya bisa dikerjakan paralel (misal: satu orang backend/schema, satu orang UI) atau dicentang satu-satu kalau solo. Urutan checklist dalam satu fase = urutan pengerjaan yang disarankan (backend dulu baru frontend, karena UI butuh service/Server Action sudah ada).

Setiap task merujuk ke keputusan/model yang sudah didefinisikan di [00-overview.md](./00-overview.md), [01-data-model.md](./01-data-model.md), [02-modules-features.md](./02-modules-features.md) — dokumen ini tidak mengulang keputusan, hanya memecahnya jadi kerjaan.

---

## Fase 0 — Fondasi (Prisma + Auth)

### Backend
- [ ] Audit `src/lib/prisma.ts`, `src/auth.ts`, `src/lib/auth.ts`, `src/types/auth.ts` — cocokkan dengan [DATABASE.md](../blueprint/DATABASE.md)
- [ ] Extend `UserRole` enum di [user.prisma](../../prisma/schema/user.prisma): `USER | ADMIN` → `SUPER_ADMIN | OPERASIONAL | KEUANGAN | SECURITY`
- [ ] Tulis migration data untuk user existing (map `ADMIN` → `SUPER_ADMIN`)
- [ ] Pastikan `requireRole()` mendukung multi-role: `requireRole(['SUPER_ADMIN', 'KEUANGAN'])`
- [ ] Putuskan & implement provider login: Credentials-only vs + Google OAuth (lihat open question di [00-overview.md](./00-overview.md))
- [ ] Setup database dev (Postgres — Neon/Supabase/local), isi `DATABASE_URL` di `.env.local`
- [ ] `npm run db:migrate` — baseline migration
- [ ] `prisma/seed.ts` — seed satu `SUPER_ADMIN`

### Infra
- [ ] Putuskan object storage untuk `Attachment` (Cloudflare R2 / Supabase Storage / UploadThing) — blocker Fase 1
- [ ] Putuskan deployment target (Vercel disarankan) — pengaruh `AUTH_URL` & env production
- [ ] Setup `.env.example` dengan semua env var baru (DATABASE_URL, storage keys, auth secrets)

### UI/UX
- [ ] Wireframe low-fidelity: layout admin shell (sidebar nav per role, topbar, breadcrumb) — dasar untuk semua halaman `/admin/*` di fase berikutnya
- [ ] Login page — form Credentials (+ tombol Google kalau dipakai)

### Frontend
- [ ] `/login` page + Server Action submit → `signIn()`
- [ ] Admin layout shell (`/admin/layout.tsx`) — sidebar dinamis berdasarkan role dari session
- [ ] Guard: redirect ke `/login` kalau belum auth, redirect ke `/admin` (403 page) kalau role tidak cukup untuk route tertentu

---

## Fase 1 — Master Data & Denah Kamar (MVP tampil)

### Backend
- [ ] `prisma/schema/property.prisma` (Floor, Room, Facility, RoomFacility, Promo)
- [ ] `prisma/schema/attachment.prisma`
- [ ] Migration + generate client
- [ ] `roomService` (admin, full field) — CRUD + `getRoomHistory()` stub (diisi Fase 4-5)
- [ ] `facilityService`, `promoService` — CRUD
- [ ] `publicRoomService` — read-only, field terbatas (tanpa data sensitif), termasuk fungsi status kamar derived dari contract aktif (stub `false` sampai Fase 2)
- [ ] `attachmentService` — upload handler ke object storage terpilih, generate URL, simpan record `Attachment`
- [ ] Server Actions: `createRoom`, `updateRoom`, `deleteRoom` (soft via `isActive`), `createFacility`, `assignFacilityToRoom`, `createPromo`, `uploadRoomPhoto`

### UI/UX
- [ ] Desain denah kamar interaktif per lantai — grid/layout kamar, color coding hijau/merah, tap target size untuk mobile (bukan hover)
- [ ] Desain modal/panel detail kamar (carousel foto, video, harga, fasilitas, ukuran, tombol WA)
- [ ] Desain halaman Beranda publik (hero, fasilitas umum, lokasi map embed, promo banner, kontak)
- [ ] Desain form admin master data (room, facility, promo) — konsisten dengan token desain di [DESIGN_SYSTEM.md](../blueprint/DESIGN_SYSTEM.md)
- [ ] Desain empty state & loading state untuk list kamar/fasilitas/promo

### Frontend
- [ ] Halaman publik `/` (Beranda) — Server Component, fetch dari `publicRoomService`/`promoService`
- [ ] `generateMetadata()` + `<StructuredData>` (`organizationSchema` + `webPageSchema`) di Beranda
- [ ] Halaman publik `/kamar` atau section denah — render per `Floor`, klik `Room` → buka modal detail (Client Component kecil untuk interaktivitas modal)
- [ ] Komponen `RoomStatusBadge`, `RoomCard`, `FloorPlan` (ikuti four-file rule: impl, stories, test, barrel — lihat [COMPONENTS.md](../blueprint/COMPONENTS.md))
- [ ] Tombol "Hubungi Admin" — `wa.me` link dengan pesan pre-filled (nomor kamar kalau dari modal kamar)
- [ ] Admin: `/admin/master-data/rooms` (list + form create/edit + upload foto/video)
- [ ] Admin: `/admin/master-data/facilities` (list + form)
- [ ] Admin: `/admin/master-data/promos` (list + form, indikator aktif/kadaluarsa)
- [ ] Responsive check: denah kamar di mobile (breakpoint test, tap bukan hover)

### QA / Verifikasi
- [ ] `npm run lint` clean
- [ ] Manual test: buat kamar baru dari admin → langsung muncul di denah publik dengan status hijau
- [ ] Manual test: upload foto kamar → tampil di carousel modal publik

---

## Fase 2 — Penyewa, Kontrak, Status Kamar Dinamis

### Backend
- [ ] `prisma/schema/tenant.prisma` (Tenant, Contract, ContractOccupant)
- [ ] Raw SQL migration: Postgres sequence per tahun untuk `contractCode`
- [ ] `generateContractCode()` — baca `nextval()` dalam transaction yang sama dengan `Contract.create`
- [ ] `tenantService` — search by KTP/nama/HP, CRUD, toggle blacklist
- [ ] `contractService` — create (validasi 1 kamar 1 contract aktif), close contract (pindah/keluar), get by tenant, get by room
- [ ] Update `roomService`/`publicRoomService` — status kamar jadi derived query (`EXISTS Contract WHERE roomId = ? AND status = ACTIVE`)
- [ ] `prisma/schema/audit.prisma` + `auditService.log()` — mulai dipanggil di `contractService` (create/close)
- [ ] Server Actions: `createTenant`, `createContract` (sewa baru), `createContractForExistingTenant` (pindah/sewa ulang — auto-close lama), `toggleBlacklist`, `uploadKtpScan`

### UI/UX
- [ ] Desain alur "Sewa Kamar Baru" — step: cari/pilih tenant → pilih kamar tersedia → isi detail kontrak → konfirmasi (wizard atau single-page form, tentukan mana yang lebih cocok untuk admin non-teknis)
- [ ] Desain form pencarian tenant existing (autocomplete by KTP/nama/HP) vs form tenant baru
- [ ] Desain halaman detail Tenant — profil + riwayat kontrak (timeline atau tabel)
- [ ] Desain halaman detail Contract — info kontrak + status + aksi (pindah/tutup kontrak)
- [ ] Desain badge/warning blacklist saat admin pilih tenant blacklisted (bukan blokir keras — modal konfirmasi)

### Frontend
- [ ] Admin: `/admin/tenants` (list, search, filter blacklist)
- [ ] Admin: `/admin/tenants/[id]` (detail + riwayat kontrak via `getRoomHistory`-style query per tenant)
- [ ] Admin: `/admin/contracts/new` (wizard sewa baru, termasuk upload KTP)
- [ ] Admin: `/admin/contracts/[id]` (detail, aksi: perpanjang/tutup/pindah kamar)
- [ ] Update denah publik & admin room list — status kamar sekarang benar-benar dinamis (tes ulang)
- [ ] Komponen `TenantSearchCombobox`, `ContractStatusBadge`, `ContractTimeline`

### QA / Verifikasi
- [ ] Manual test: buat kontrak baru → kamar langsung merah di denah publik
- [ ] Manual test: pindah kamar tenant existing → kontrak lama `ENDED`, kontrak baru `ACTIVE` dengan `contractCode` baru, `Tenant` tidak terduplikasi
- [ ] Manual test: coba buat 2 contract aktif di kamar yang sama → harus ditolak dengan pesan jelas
- [ ] Cek `AuditLog` tercatat untuk aksi create/close contract

---

## Fase 3 — Pembayaran

### Backend
- [x] `prisma/schema/payment.prisma`
- [x] `paymentService.getPaymentStatus(payment, today)` — pure function status derivation
- [x] `paymentService.generateMonthlyInvoices()` — idempotent (manfaatkan `@@unique([contractId, periodMonth, periodYear])`)
- [x] Keputusan: tombol manual admin (cron via `scheduled-tasks` skill belum dipasang, opsional belakangan)
- [x] Server Actions: `markAsPaidAction`, `addPartialPaymentAction` (dengan `requireRole(['KEUANGAN','SUPER_ADMIN'])`)
- [x] `src/lib/whatsapp.ts` — `buildReminderMessage(tenant, contract, payment)`, `buildWaLink(phone, message)`
- [x] Audit log untuk aksi pembayaran

### UI/UX
- [x] Desain list pembayaran — filter by status (4 warna badge: Belum Jatuh Tempo/Jatuh Tempo/Lunas/Terlambat), filter by bulan/tahun
- [x] Desain form "Tambah Pembayaran" (parsial) — nominal, metode, catatan
- [x] Desain tombol aksi cepat: "Sudah Dibayar" (satu klik) + "Kirim WA" (di halaman detail, muncul saat DUE/OVERDUE)
- [ ] Desain ringkasan tunggakan per tenant/kamar (belum ada widget khusus — overdue count sudah ada di dashboard Fase 5, tapi belum per-tenant/per-kamar breakdown)

### Frontend
- [x] Admin: `/admin/payments` (list + filter + badge status + aksi generate)
- [x] Admin: `/admin/payments/[id]` (detail, tambah pembayaran parsial, tandai lunas, upload bukti transfer via `PaymentProofUpload` + `attachmentService` dengan `AttachmentEntity.PAYMENT`)
- [x] Tombol "Kirim WA" → buka `wa.me` link tab baru (Client Component `SendWaButton`)
- [x] Tombol "Generate Tagihan Bulan Ini" di halaman payments
- [x] Komponen `PaymentStatusBadge`; aksi dipecah jadi `MarkPaidButton` + `AddPaymentForm` (bukan satu `PaymentActionButtons` gabungan)

### QA / Verifikasi
- [x] `npm run lint`, `type-check`, `test:run` hijau
- [ ] Manual test end-to-end di browser (generate tagihan 2x tidak duplikat, status berubah sesuai tanggal, "Kirim WA" membuka pesan benar) — **blocker: `DATABASE_URL` belum diisi**, lihat Infra & Keputusan Prasyarat di [03-roadmap.md](./03-roadmap.md)

---

## Fase 4 — Maintenance & Insiden

*(bisa paralel dengan Fase 3 kalau ada 2 developer — sama-sama hanya bergantung ke Fase 1)*

### Backend
- [ ] `prisma/schema/maintenance.prisma`, `prisma/schema/incident.prisma`
- [ ] `maintenanceService` — CRUD, filter scope/kamar/lantai/tanggal, kategori free-text dengan distinct-values query untuk datalist
- [ ] `incidentService` — CRUD, filter kategori/status/kamar/lantai
- [ ] `roomService.getRoomHistory(roomId)` — gabungkan contract + maintenance + payment (SUM pemasukan vs SUM biaya)
- [ ] Audit log untuk mutasi maintenance & incident

### UI/UX
- [ ] Desain form maintenance — field `Room` muncul kondisional saat scope = ROOM
- [ ] Desain kategori maintenance sebagai input dengan suggestion (datalist), bukan dropdown kaku
- [ ] Desain form insiden — dropdown 6 kategori tetap, field lokasi bebas teks kalau bukan kamar
- [ ] Desain halaman "Riwayat Kamar" (di detail Room) — timeline gabungan penghuni + maintenance + ringkasan profitabilitas

### Frontend
- [ ] Admin: `/admin/maintenance` (list + filter), `/admin/maintenance/new`
- [ ] Admin: `/admin/incidents` (list + filter), `/admin/incidents/new`
- [ ] Update `/admin/master-data/rooms/[id]` — tambah section riwayat kamar (kontrak, maintenance, net profitability)
- [ ] Upload foto di form maintenance & insiden (pakai `attachmentService` dari Fase 1)

### QA / Verifikasi
- [ ] Manual test: maintenance scope BUILDING tidak minta pilih kamar
- [ ] Manual test: riwayat kamar menampilkan angka pemasukan/biaya yang benar dibanding data payment & maintenance manual

---

## Fase 5 — Dashboard & Laporan

### Backend
- [ ] `dashboardService` — fungsi agregat: total/kosong/terisi kamar, pendapatan bulan ini, jumlah overdue, maintenance bulan ini + biaya, insiden bulan ini by status
- [ ] Caching agregat (`unstable_cache` atau TanStack Query untuk filter interaktif client-side)
- [ ] `reportService` — 4 kategori (keuangan, penyewa, maintenance, insiden), tiap kategori terima param periode (harian/mingguan/bulanan/tahunan/custom) + scope (kamar/lantai/gedung)
- [ ] Tambahkan `recharts` ke `package.json` (atau pilih native SVG kalau grafik sederhana)

### UI/UX
- [ ] Desain layout dashboard — widget grid, prioritas info paling actionable di atas (overdue payment, insiden open)
- [ ] Desain varian dashboard per role (Keuangan fokus angka, Security fokus insiden, dst — atau satu layout dengan visibility per widget)
- [ ] Desain filter periode + scope untuk laporan — komponen reusable dipakai di 4 halaman laporan
- [ ] Desain tampilan laporan yang enak diprint (browser print) sebagai pengganti export PDF di fase ini

### Frontend
- [ ] `/admin` (root, landing setelah login) — render widget dashboard sesuai role
- [ ] Grafik pendapatan/okupansi (dataviz skill kalau dipakai saat implementasi)
- [ ] Admin: `/admin/reports/financial`, `/admin/reports/tenants`, `/admin/reports/maintenance`, `/admin/reports/incidents`
- [ ] Komponen filter periode+scope reusable (`ReportFilterBar`)
- [ ] Print-friendly CSS untuk halaman laporan

### QA / Verifikasi
- [ ] Cross-check angka dashboard vs query manual (SUM payment bulan ini benar)
- [ ] Test role-based dashboard: login sebagai KEUANGAN vs SECURITY, cek widget yang tampil beda sesuai rencana akses

---

## Fase 6 — Role & Permission Refinement + Audit Log Viewer

### Backend
- [x] Review ulang semua Server Action mutasi dari Fase 1-5 — 11 aksi yang tidak menulis `AuditLog` sudah dilengkapi; semua aksi mutasi sudah pakai `requireRole()` yang benar
- [x] `userService` — create/update/soft-delete user admin + assign role (SUPER_ADMIN only), password di-hash bcrypt, `password` tidak pernah ikut ter-select
- [x] `auditService.list()` + `entityTypes()` — sisi baca untuk viewer (filter + paginasi 50/halaman)
- [x] `User.isActive` + migration `20260726090000_add_user_is_active`; login user nonaktif ditolak di `src/auth.ts`
- [x] `canAccess()` di `src/lib/auth.ts` — varian non-throwing untuk page/layout

### UI/UX
- [x] Desain halaman audit log — tabel filter entitas/pengguna/aksi/tanggal, diff before/after pakai `<details>` + `<pre>` JSON (tanpa Client Component)
- [x] Desain halaman manajemen user — list dengan badge role/status, form create inline, halaman detail untuk edit + aktif/nonaktif
- [x] Layar 403 (`Forbidden.tsx`) — tampil di dalam admin shell, dengan link balik ke dashboard

### Frontend
- [x] Admin: `/admin/audit-log` (SUPER_ADMIN only)
- [x] Admin: `/admin/users` + `/admin/users/[id]` (SUPER_ADMIN only)
- [x] Item sidebar "Audit Log" & "Pengguna" (SUPER_ADMIN only)
- [x] Layout guard baru: `/admin/master-data/*` (sebelumnya tidak ada guard sama sekali), `/admin/audit-log`, `/admin/users`

### QA / Verifikasi
- [x] Semua layout/page `/admin/*` yang dibatasi role sekarang render `<Forbidden />` (403), bukan throw ke error boundary — termasuk 4 halaman laporan
- [x] Audit log lengkap: tidak ada mutasi dari fase sebelumnya yang lolos tanpa tercatat
- [x] `npm run lint`, `type-check`, `test:run` hijau
- [x] Smoke test service ke DB asli: create/update/soft-delete user, password ter-hash & tidak berubah saat field dikosongkan, duplikat email ditolak, Super Admin terakhir tidak bisa dinonaktifkan/diturunkan, filter + paginasi audit log
- [ ] Klik-klik manual di browser sebagai tiap role (butuh login manual — akun uji per role belum dibuat)

---

## Cross-Cutting (berlaku di semua fase, bukan tugas satu kali)

### Frontend / UI
- [ ] Semua komponen baru ikut four-file rule ([COMPONENTS.md](../blueprint/COMPONENTS.md)): implementation + stories + test + barrel
- [ ] Semua warna pakai design token — audit dengan grep raw hex/oklch sebelum PR
- [ ] Semua Server Component fetch lewat service, tidak ada `fetch`/`apiClient` langsung di komponen
- [ ] `next-intl` — semua teks baru masuk translation file, bukan hardcode string (cek [I18N.md](../blueprint/I18N.md))
- [ ] Semua route pakai `@/i18n/navigation`, bukan `next/navigation`

### Backend
- [ ] Semua Server Action baru divalidasi input dengan Zod ([SERVICES.md](../blueprint/SERVICES.md))
- [ ] Semua service baru sebagai plain object, bukan class, konsisten pola existing

### QA
- [ ] `npm run lint` (`--max-warnings 0`) exit 0 sebelum tiap fase dianggap selesai
- [ ] Test end-to-end manual di browser untuk golden path tiap modul baru (bukan cuma type-check)

---

← [03-roadmap.md](./03-roadmap.md) | [Plan Index](./README.md)
