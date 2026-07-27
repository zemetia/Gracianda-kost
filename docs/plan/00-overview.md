# Gracianda House Management System — Overview

← [Plan Index](./README.md)

---

## Tujuan

Sistem manajemen rumah kost yang membantu **pekerjaan admin**, bukan sekadar mencatat ulang apa yang admin lakukan manual. Fokus otomasi ada di tiga titik dengan ROI tertinggi: status pembayaran, reminder WhatsApp, dan riwayat kamar/penyewa yang saat ini tidak terdokumentasi sama sekali.

Sistem terdiri dari dua permukaan:

- **Website publik** — promosi, denah kamar interaktif, kontak admin. Tanpa login.
- **Admin panel** — semua modul operasional (kamar, penyewa, kontrak, pembayaran, maintenance, insiden, laporan, dashboard). Wajib login, role-based.

---

## Keputusan Desain Kunci

### 1. Tenant ≠ Contract

Ini perubahan paling penting dari narasi awal. Dipisah jadi dua entitas:

- **Tenant (Penyewa)** — data orang: KTP, nama, kontak, kendaraan. Dibuat **sekali**, dipakai ulang.
- **Contract (Kontrak Sewa)** — satu transaksi sewa: kamar, harga, tanggal masuk/keluar, deposit. Dibuat **setiap kali** ada penyewaan baru — baik penyewa baru, penyewa pindah kamar, atau penyewa lama yang kembali menyewa.

Konsekuensi:
- Riwayat penyewa otomatis ada — tinggal query semua `Contract` milik satu `Tenant`.
- Riwayat kamar otomatis ada — tinggal query semua `Contract` milik satu `Room`.
- Status kamar (`Tersedia` / `Terisi`) adalah **derived state** dari ada-tidaknya `Contract` aktif pada kamar itu, bukan field yang di-toggle manual.
- ID Sewa (`GH-250001`) menempel ke `Contract`, bukan ke `Tenant`. Tenant yang sama bisa punya banyak Contract dengan ID Sewa berbeda.

Detail model lengkap: [01-data-model.md](./01-data-model.md).

### 2. ID Sewa, bukan NIS

Format: `GH-YYNNNN` (prefix building + tahun 2 digit + sequence 4 digit), contoh `GH-250001`. Digenerate otomatis saat `Contract` dibuat, lewat DB sequence per tahun — bukan dihitung di aplikasi (race condition saat dua admin input bersamaan).

### 3. Status pembayaran dihitung, bukan diketik admin

Status (`BELUM_JATUH_TEMPO` / `MENUNGGU_PEMBAYARAN` / `LUNAS` / `TERLAMBAT`) adalah fungsi dari `dueDate`, `paidAt`, dan tanggal hari ini — dihitung di service layer setiap kali dibaca, bukan disimpan sebagai field yang admin ubah manual. Admin hanya punya dua aksi: **"Tandai Lunas"** dan **"Tambah Pembayaran"** (untuk cicilan/parsial).

### 4. WhatsApp: click-to-chat dulu, API belakangan

Fase awal pakai `wa.me` deep link dengan pesan pre-filled dari template — nol biaya, nol approval WhatsApp Business API. Upgrade ke WhatsApp Cloud API (untuk reminder terjadwal otomatis tanpa klik admin) dijadikan fase terpisah karena butuh verifikasi Meta Business dan nomor terdedikasi.

### 5. Role & Permission

Extend `UserRole` enum yang sudah ada di [user.prisma](../../prisma/schema/user.prisma) dari `USER | ADMIN` menjadi peran operasional nyata:

- `SUPER_ADMIN` — akses penuh, termasuk manajemen user & audit log
- `OPERASIONAL` — kamar, penyewa, kontrak, maintenance, insiden
- `KEUANGAN` — pembayaran, laporan keuangan (read-only di modul lain)
- `SECURITY` — insiden, laporan insiden (read-only di modul lain)

`requireRole()` sudah tersedia di [src/lib/auth.ts](../../src/lib/auth.ts) — tinggal dipakai per Server Action.

### 6. Dokumen sebagai satu tabel polimorfik

KTP scan, foto kamar, bukti pembayaran, foto kondisi maintenance/insiden — semua lewat satu model `Attachment` (`entityType` + `entityId` + `url` + `kind`) alih-alih field foto terpisah di tiap tabel. Konsisten dengan gaya "master data tanpa bantuan programmer": nambah jenis dokumen baru tidak perlu migrasi schema.

### 7. Audit log otomatis di service layer

Bukan trigger DB — dicatat eksplisit di setiap Server Action yang mengubah data (create/update/delete), sesudah aksi berhasil. Konsisten dengan pola `requireAuth()` yang sudah ada.

---

## Yang Sengaja Belum Masuk Scope Awal

Supaya fase 1 tetap achievable, ini didorong ke fase lanjutan (lihat [03-roadmap.md](./03-roadmap.md)):

- WhatsApp Cloud API (reminder otomatis terjadwal tanpa klik admin)
- Payment gateway (transfer manual + upload bukti dulu; Midtrans/Xendit belakangan)
- Multi-property (skema didesain agar tidak menyakitkan untuk diperluas nanti, tapi UI fase 1 asumsi satu gedung)
- Kalender okupansi visual (butuh data kontrak dulu untuk ada isinya)

---

## Pertanyaan Terbuka Untuk Kamu

Ini tidak menghambat mulai development, tapi mempengaruhi beberapa keputusan desain — jawab kapan pun sebelum modul terkait dikerjakan:

1. Satu gedung atau rencana ekspansi ke gedung lain dalam waktu dekat? (Mempengaruhi apakah `Building` jadi model eksplisit dari awal.)
2. Deposit: selalu ada, opsional per kontrak, atau tidak dipakai sama sekali?
3. Approval flow untuk "Tandai Lunas" — cukup satu klik admin, atau perlu approval dari Keuangan untuk nominal besar?
4. Nomor WhatsApp admin: satu nomor shared, atau per-admin?

---

## Dokumen Terkait

| File | Isi |
|---|---|
| [01-data-model.md](./01-data-model.md) | Skema Prisma lengkap semua entitas |
| [02-modules-features.md](./02-modules-features.md) | Breakdown fitur per modul, dipetakan ke narasi asli |
| [03-roadmap.md](./03-roadmap.md) | Urutan pengerjaan per fase, dependency antar modul |

← [Plan Index](./README.md)
