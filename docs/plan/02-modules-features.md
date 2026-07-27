# Modules & Features

← [01-data-model.md](./01-data-model.md) | [Plan Index](./README.md)

---

Setiap modul dipetakan ke: halaman, service, Server Action, dan role yang boleh akses. Pola implementasi ikut [ARCHITECTURE.md](../blueprint/ARCHITECTURE.md) — Server Component memanggil Service langsung; Route Handler (`/app/api/*`) hanya dibuat kalau data perlu diakses dari Client Component atau pihak eksternal (misal, endpoint publik denah kamar yang di-fetch client-side untuk interaktivitas).

---

## 1. Website Publik

**Akses:** publik, tanpa login.

### Beranda
- Profil, fasilitas umum, lokasi (embed Google Maps `iframe`, bukan API — nol biaya), kontak, promo aktif (banner dari `Promo` model, filter `isActive && startDate <= now <= endDate`), tombol "Hubungi Admin" → `wa.me` link.
- `generateMetadata()` + `<StructuredData>` wajib (non-negotiable blueprint) — pakai `organizationSchema` + `webPageSchema`.

### Denah Kamar Interaktif
- Render per lantai (`Floor` → `Room[]`), warna kamar dari status derived (hijau = tidak ada contract aktif, merah = ada).
- **Klik**, bukan hover — sesuai catatan kamu, penting untuk mobile.
- Klik kamar → panel/modal: foto (carousel dari `Attachment kind=PHOTO`), video opsional, harga, fasilitas (`RoomFacility` → `Facility`), ukuran, status, tombol "Hubungi Admin" dengan pesan pre-filled berisi nomor kamar.
- Data kamar untuk denah publik hanya field non-sensitif (tidak expose data penyewa). Butuh service publik terpisah dari service admin (`publicRoomService` vs `roomService`) supaya tidak ada kebocoran data lewat response yang kelebihan field.

---

## 2. Master Data

**Akses:** `SUPER_ADMIN`, `OPERASIONAL`.

CRUD untuk: `Room`, `Floor`, `Facility`, `Promo`, foto/video kamar (`Attachment`). Semua lewat form admin — tidak ada yang butuh deploy ulang untuk ubah harga/fasilitas/promo.

Halaman: `/admin/master-data/rooms`, `/admin/master-data/facilities`, `/admin/master-data/promos`.

---

## 3. Data Penyewa & Kontrak

**Akses:** `SUPER_ADMIN`, `OPERASIONAL` (create/update); `KEUANGAN` (read untuk cross-check pembayaran).

### Alur "Sewa Kamar Baru"
1. Admin cari `Tenant` existing (by KTP/nama/HP) atau buat baru.
2. Pilih `Room` yang statusnya tersedia.
3. Isi detail kontrak: harga (default dari `Room.price`, bisa di-override), deposit, tanggal masuk, penghuni tambahan.
4. Submit → Server Action: validasi tidak ada contract `ACTIVE` lain di kamar itu → generate `contractCode` (`GH-YYNNNN`) → create `Contract` dalam transaction → tulis `AuditLog`.
5. Upload KTP scan → `Attachment`.

### Alur "Pindah Kamar" / "Sewa Ulang"
- Sama seperti sewa baru, tapi `Tenant` dipilih dari existing record. Kontrak lama (jika masih `ACTIVE`) di-set `ENDED` + `actualEndDate` di transaction yang sama.
- **Tidak** membuat `Tenant` baru — ini poin inti dari pemisahan Tenant/Contract.

### Blacklist
- Toggle `Tenant.isBlacklisted` + `blacklistNote`. Ditampilkan sebagai warning saat admin mencoba buat kontrak baru untuk tenant itu (tidak diblokir keras — kasus valid seperti "sudah selesai masalah" bisa terjadi, cukup warning + butuh konfirmasi).

Halaman: `/admin/tenants`, `/admin/tenants/[id]` (detail + riwayat kontrak), `/admin/contracts/new`, `/admin/contracts/[id]`.

---

## 4. Pembayaran

**Akses:** `SUPER_ADMIN`, `KEUANGAN` (full); `OPERASIONAL` (read-only).

### Generate tagihan bulanan
- Job (cron via `scheduled-tasks` atau manual trigger admin) yang membuat `Payment` row untuk setiap `Contract ACTIVE` di awal periode, dengan `dueDate` = tanggal jatuh tempo (misal tanggal 5 tiap bulan, dikonfigurasi per contract atau global default).
- Alternatif fase 1 (lebih sederhana, tanpa cron): admin generate manual dari tombol "Generate Tagihan Bulan Ini" di dashboard pembayaran — idempotent karena `@@unique([contractId, periodMonth, periodYear])`.

### Status & aksi
- Status dihitung (lihat [01-data-model.md](./01-data-model.md#paymentprisma)), ditampilkan sebagai badge warna di list.
- Tombol **"Sudah Dibayar"** → set `amountPaid = amountDue`, `paidAt = now()`.
- Tombol **"Tambah Pembayaran"** → form input nominal parsial + metode + catatan, akumulasi ke `amountPaid`.
- Kedua aksi lewat Server Action dengan `requireRole('KEUANGAN')` (atau `SUPER_ADMIN`), tulis `AuditLog`.

### Reminder WhatsApp
- Template pesan sebagai fungsi murni di `src/lib/whatsapp.ts`:
  ```ts
  buildReminderMessage(tenant, contract, payment): string
  buildWaLink(phone: string, message: string): string // wa.me/62xxx?text=...
  ```
- Tombol "Kirim WA" di tiap row payment yang `DUE`/`OVERDUE` → buka `wa.me` link di tab baru (`target="_blank"`, client component kecil).
- **Bukan** dikirim otomatis oleh server — admin tetap yang klik kirim (fase 1). Otomatisasi penuh (WhatsApp Cloud API + cron) masuk fase lanjutan, lihat [03-roadmap.md](./03-roadmap.md).

Halaman: `/admin/payments` (list + filter status/bulan), `/admin/payments/[id]`.

---

## 5. Riwayat Kamar

**Akses:** `SUPER_ADMIN`, `OPERASIONAL` (read).

Bukan modul CRUD terpisah — halaman detail kamar (`/admin/master-data/rooms/[id]`) menampilkan:
- Semua `Contract` (via `roomId`) diurut terbaru, dengan tenant, periode, status.
- Semua `MaintenanceRecord` untuk kamar itu.
- Total pemasukan (SUM `Payment.amountPaid` dari semua contract kamar itu) vs total biaya (SUM `MaintenanceRecord.cost`) → net profitability per kamar.

Ini query agregat di service layer (`roomService.getRoomHistory(roomId)`), bukan tabel baru.

---

## 6. Maintenance

**Akses:** `SUPER_ADMIN`, `OPERASIONAL`.

Dua scope dalam satu model (`MaintenanceRecord.scope: ROOM | BUILDING`) — form UI beda dikit (field `Room` muncul hanya kalau scope `ROOM`), tapi data model dan service sama. Ini menghindari duplikasi CRUD untuk dua kategori yang sebenarnya identik strukturnya.

Kategori (`category`) free-text dengan datalist suggestion dari kategori yang sudah pernah dipakai — bukan enum kaku, supaya admin bisa nambah jenis baru (misal "Wifi Router") tanpa migrasi.

Halaman: `/admin/maintenance` (list + filter scope/kamar/lantai/tanggal), `/admin/maintenance/new`.

---

## 7. Insiden

**Akses:** `SUPER_ADMIN`, `SECURITY` (full); `OPERASIONAL` (read + create).

CRUD sama pola dengan Maintenance. `IncidentCategory` pakai enum (bukan free-text) karena kategori ini dipakai untuk laporan/filter yang butuh konsistensi (vs kategori maintenance yang lebih fleksibel/operasional).

Halaman: `/admin/incidents`, `/admin/incidents/new`.

---

## 8. Dashboard

**Akses:** semua role yang login, konten disesuaikan role (Keuangan tidak perlu lihat widget insiden security-sensitive, dst — atau tampilkan semua tapi read-only sesuai permission, TBD saat implementasi).

Widget (semua computed di service layer, cached dengan `unstable_cache` atau TanStack Query jika perlu client interactivity untuk filter tanggal):
- Total kamar, kosong, terisi (dari status derived)
- Pendapatan bulan ini (SUM `Payment.amountPaid` where periode = bulan ini)
- Jumlah pembayaran `OVERDUE`
- Jumlah maintenance bulan ini + total biaya
- Jumlah insiden bulan ini by status

Grafik pakai library ringan (`recharts` — belum ada di package.json, perlu ditambahkan) atau native SVG kalau cuma butuh bar/line sederhana (konsisten dengan `dataviz` skill kalau dipakai saat implementasi).

Halaman: `/admin` (root admin, jadi landing page setelah login).

---

## 9. Laporan

**Akses:** `SUPER_ADMIN` (semua); `KEUANGAN` (keuangan); `OPERASIONAL` (penyewa/maintenance); `SECURITY` (insiden).

Filter umum: periode (harian/mingguan/bulanan/tahunan/custom range), scope (kamar/lantai/seluruh gedung).

Empat kategori laporan, masing-masing query agregat, bukan tabel tersendiri:
- **Keuangan** — pendapatan, pengeluaran (maintenance cost), profit, breakdown per kamar/lantai/gedung
- **Penyewa** — aktif, keluar (periode ini), baru (periode ini), terlambat bayar, blacklist
- **Maintenance** — per kamar/lantai/gedung, total biaya
- **Insiden** — per kamar/lantai/gedung, breakdown status/kategori

Export ke Excel/PDF didorong ke fase lanjutan (butuh library tambahan — `exceljs` / server-side PDF generation) — fase 1 cukup tampilan di web + fungsi print browser.

Halaman: `/admin/reports/financial`, `/admin/reports/tenants`, `/admin/reports/maintenance`, `/admin/reports/incidents`.

---

## 10. Fitur Tambahan (dari rekomendasi kamu)

Dipetakan langsung ke arsitektur di atas — bukan modul baru:

| Fitur | Sudah tercakup di |
|---|---|
| Kalender okupansi | Query `Contract` by date range, render di halaman baru `/admin/calendar` — fase lanjutan setelah data contract cukup banyak untuk berguna |
| Riwayat penyewa | Halaman detail `Tenant` (§3) |
| Upload dokumen | `Attachment` model (§ semua modul) |
| Pengingat masa sewa berakhir | Query `Contract` where `endDate` dalam N hari ke depan, widget di dashboard + tombol WA reminder (sama pola dengan payment reminder) |
| Dashboard analitik | §8 |
| Audit log | `AuditLog` model, dicatat di setiap Server Action mutasi — halaman viewer `/admin/audit-log` (SUPER_ADMIN only) |
| Role & permission | `UserRole` enum diperluas + `requireRole()` (§ semua modul) |

---

## Ringkasan Akses per Role

| Modul | SUPER_ADMIN | OPERASIONAL | KEUANGAN | SECURITY |
|---|---|---|---|---|
| Master Data | CRUD | CRUD | Read | Read |
| Penyewa & Kontrak | CRUD | CRUD | Read | – |
| Pembayaran | CRUD | Read | CRUD | – |
| Maintenance | CRUD | CRUD | Read | – |
| Insiden | CRUD | Create+Read | – | CRUD |
| Dashboard | Full | Full | Full | Full |
| Laporan | Semua | Penyewa+Maintenance | Keuangan | Insiden |
| Audit Log | Read | – | – | – |
| Manajemen User | CRUD | – | – | – |

← [01-data-model.md](./01-data-model.md) | [03-roadmap.md](./03-roadmap.md) →
