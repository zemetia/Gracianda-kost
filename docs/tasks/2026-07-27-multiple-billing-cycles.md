# Task: Implementasi Multi-Durasi Sewa (Billing Cycles)

- **Date**: 2026-07-27
- **Status**: In Progress
- **Source**: USER Request (Step Id: /planning-tasks)

## 🎯 Goal

Mendukung opsi harga sewa dengan siklus penagihan bervariasi (Harian, Mingguan, Bulanan, Tahunan, 3-Bulanan, 6-Bulanan, dll.) baik pada tingkat visualisasi publik, form input admin, sistem kontrak, maupun generator tagihan otomatis.

## 📋 Implementation Checklist

### 🔍 Phase 1: Research & Setup
- [ ] **Step 1.1: Verifikasi Integrasi Prisma & Driver PG**
  - *Task*: Pastikan migrasi modular schema didukung penuh oleh CLI tanpa masalah di Windows.
  - *Definition of Done*: `npm run db:generate` berjalan sukses.
- [ ] **Step 1.2: Analisis Kode Existing Untuk Fallback Kamar**
  - *Task*: Periksa file queries di client room service untuk menentukan apakah query memecah data harga atau tidak.
  - *Definition of Done*: Mengidentifikasi file query publik (`src/services/room.service.ts`) yang perlu diperbarui.

### 💾 Phase 2: Database Layer Changes
- [ ] **Step 2.1: Definisikan Enum & Model RoomPrice**
  - *Task*: Modifikasi [property.prisma](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/prisma/schema/property.prisma) dengan menambahkan enum `BillingCycle` dan model `RoomPrice`. Tambahkan relasi `prices` ke `Room`.
  - *Definition of Done*: File Prisma disimpan dan divalidasi.
- [ ] **Step 2.2: Perbarui Model Contract**
  - *Task*: Modifikasi [tenant.prisma](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/prisma/schema/tenant.prisma) dengan menambahkan kolom `billingCycle` dan `billingInterval` ke model `Contract`.
  - *Definition of Done*: File Prisma disimpan dan divalidasi.
- [ ] **Step 2.3: Generate & Jalankan Migrasi Database**
  - *Task*: Jalankan perintah migrasi prisma `npm run db:migrate` untuk membuat tabel baru dan update schema database lokal.
  - *Definition of Done*: Migrasi selesai dideploy ke database PostgreSQL (port 5434).
- [ ] **Step 2.4: Update Seeder Script**
  - *Task*: Ubah [seed.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/prisma/seed.ts) agar men-seed `RoomPrice` default (Bulanan) untuk kamar contoh yang dibuat.
  - *Definition of Done*: Seeder berhasil dijalankan via `npm run db:seed` tanpa error.

### ⚙️ Phase 3: Backend Logic & Services
- [ ] **Step 3.1: Tambah Validations Zod**
  - *Task*: Update Zod schemas di [validations/tenant.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/lib/validations/tenant.ts) untuk mendukung input `billingCycle` dan `billingInterval`.
  - *Definition of Done*: Compiler TS sukses mengenali tipe-tipe Zod baru.
- [ ] **Step 3.2: Perbarui Services Kamar**
  - *Task*: Update `roomService` dan `publicRoomService` di [room.service.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/services/room.service.ts) agar menyertakan `prices` di return value.
  - *Definition of Done*: Query Room menyertakan relasi `prices`.
- [ ] **Step 3.3: Implementasi Pembuatan Tagihan Pertama di Contract Creation**
  - *Task*: Modifikasi `contractService.create` di [contract.service.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/services/contract.service.ts) agar menghitung `amountDue` secara dinamis berdasarkan siklus sewa dan langsung membuat record `Payment` pertama (dimuka).
  - *Definition of Done*: Pembuatan kontrak secara otomatis menyisipkan 1 record `Payment` yang sesuai ke DB.
- [ ] **Step 3.4: Optimasi Billing Runner Otomatis**
  - *Task*: Modifikasi `paymentService.generateMonthlyInvoices` di [payment.service.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/services/payment.service.ts) agar mengabaikan kontrak `DAILY`/`WEEKLY` dan hanya menagih kontrak berkala (`MONTHLY` dengan interval bervariasi) ketika siklusnya tiba.
  - *Definition of Done*: Tagihan bulanan hanya menjangkau kontrak yang aktif dan jatuh tempo pada siklusnya.

### 🖥️ Phase 4: Frontend UI (Admin & Public)
- [ ] **Step 4.1: Form Input Kamar (RoomForm)**
  - *Task*: Ubah [RoomForm.tsx](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/app/%5Blocale%5D/admin/master-data/rooms/RoomForm.tsx) dan action-nya agar mendukung input dinamis berbagai harga kamar.
  - *Definition of Done*: Admin bisa menyimpan tarif Harian, Mingguan, Bulanan, dll. per kamar.
- [ ] **Step 4.2: Form Kontrak Baru (NewContractForm)**
  - *Task*: Ubah [NewContractForm.tsx](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/app/%5Blocale%5D/admin/contracts/NewContractForm.tsx) agar:
    - Menampilkan dropdown pilihan siklus (Harian, Bulanan, dll.).
    - Mengisi harga secara otomatis saat kamar dan siklus dipilih.
    - Menghitung tanggal keluar (`endDate`) secara otomatis setelah durasi dimasukkan.
  - *Definition of Done*: Pembuatan kontrak dapat disesuaikan durasinya dengan kalkulasi tanggal otomatis.
- [ ] **Step 4.3: Drawer Detail Kamar Publik**
  - *Task*: Perbarui [RoomFloorPlan.tsx](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/app/%5Blocale%5D/RoomFloorPlan.tsx) agar menampilkan daftar harga sewa (Daily, Weekly, Monthly, dll.) yang aktif untuk kamar tersebut dalam bentuk tabel/kartu kecil.
  - *Definition of Done*: Calon penyewa dapat melihat ragam harga sewa langsung dari denah lantai publik.

### 🧪 Phase 5: Testing & Verification
- [ ] **Step 5.1: Unit Testing Logika Tanggal & Tagihan**
  - *Task*: Buat file test baru untuk memverifikasi fungsionalitas penentuan tanggal keluar dan perhitungan jumlah tagihan.
  - *Definition of Done*: Seluruh test suite (`npm run test`) lolos 100%.
- [ ] **Step 5.2: Verifikasi E2E Manual**
  - *Task*: Daftarkan kamar baru, buat sewa harian (3 hari) dan sewa bulanan, pastikan tagihan pertama terbuat tepat, dan lakukan run tagihan bulanan.
  - *Definition of Done*: Validasi data di DB (via Prisma Studio atau Query) menunjukkan data terbuat secara akurat dan tidak bocor.

---

## 🛠️ Technical Details

- **Files affected**:
  - [property.prisma](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/prisma/schema/property.prisma)
  - [tenant.prisma](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/prisma/schema/tenant.prisma)
  - [seed.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/prisma/seed.ts)
  - [tenant.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/lib/validations/tenant.ts)
  - [room.service.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/services/room.service.ts)
  - [contract.service.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/services/contract.service.ts)
  - [payment.service.ts](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/services/payment.service.ts)
  - [RoomForm.tsx](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/app/%5Blocale%5D/admin/master-data/rooms/RoomForm.tsx)
  - [NewContractForm.tsx](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/app/%5Blocale%5D/admin/contracts/NewContractForm.tsx)
  - [RoomFloorPlan.tsx](file:///d:/Kerja/.Zemetia%20Software%20House/Gracianda-kost/src/app/%5Blocale%5D/RoomFloorPlan.tsx)
- **Dependencies**: Prisma Client, Zod validations, next-intl.

---

## 📝 Notes & Discoveries

* **Prisma 7 Multi-File Schema**: Penggabungan file schema dilakukan otomatis di build time. Ingat untuk menjalankan `npm run db:generate` setelah memodifikasi skema prisma agar client mendeteksi perubahan model.
