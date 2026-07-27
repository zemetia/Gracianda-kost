# Data Model

← [00-overview.md](./00-overview.md) | [Plan Index](./README.md)

---

Setiap grup entitas jadi file `.prisma` terpisah di `prisma/schema/`, sesuai pola modular yang sudah ada di [DATABASE.md](../blueprint/DATABASE.md). Semua model baru relasi ke `User` lewat `createdBy`/`updatedBy` opsional untuk audit trail, tidak wajib.

```
prisma/schema/
├── base.prisma        (existing)
├── user.prisma         (existing — role enum diperluas)
├── auth.prisma         (existing)
├── property.prisma     (Room, Floor, Facility, RoomFacility, Promo)
├── tenant.prisma        (Tenant, Contract, ContractOccupant)
├── payment.prisma       (Payment, PaymentReminderTemplate)
├── maintenance.prisma   (MaintenanceRecord)
├── incident.prisma      (Incident)
├── attachment.prisma    (Attachment — polymorphic documents/photos)
└── audit.prisma         (AuditLog)
```

---

## user.prisma (perubahan)

```prisma
enum UserRole {
  SUPER_ADMIN
  OPERASIONAL
  KEUANGAN
  SECURITY
}
```

> Breaking change dari `USER | ADMIN`. Butuh migration data: map existing `ADMIN` → `SUPER_ADMIN`, `USER` → hapus atau jadi `OPERASIONAL` tergantung siapa user existing saat ini (kemungkinan cuma seed/dev account, cek dulu sebelum migrate).

---

## property.prisma

```prisma
model Floor {
  id     String @id @default(cuid())
  name   String // "Lantai 1"
  order  Int    // urutan tampil di denah

  rooms Room[]

  @@map("floors")
}

model Room {
  id           String   @id @default(cuid())
  number       String   @unique // "203"
  floorId      String
  floor        Floor    @relation(fields: [floorId], references: [id])
  price        Decimal  @db.Decimal(12, 2)
  sizeSqm      Decimal? @db.Decimal(5, 2)
  description  String?
  isActive     Boolean  @default(true) // soft-disable kamar (renovasi total, dst)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  facilities   RoomFacility[]
  contracts    Contract[]
  maintenance  MaintenanceRecord[]
  incidents    Incident[]

  @@map("rooms")
}

// status kamar TIDAK disimpan di sini — dihitung di service layer
// dari ada/tidaknya Contract dengan status ACTIVE pada Room ini

model Facility {
  id   String @id @default(cuid())
  name String @unique // "AC", "Kamar Mandi Dalam"
  icon String? // lucide icon name, untuk tampilan denah

  rooms RoomFacility[]

  @@map("facilities")
}

model RoomFacility {
  roomId     String
  facilityId String
  room       Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  facility   Facility @relation(fields: [facilityId], references: [id], onDelete: Cascade)

  @@id([roomId, facilityId])
  @@map("room_facilities")
}

model Promo {
  id          String    @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  @@map("promos")
}
```

Foto/video kamar **tidak** jadi field di `Room` — lewat `Attachment` (`entityType: "ROOM"`, `entityId: room.id`, `kind: "PHOTO" | "VIDEO"`).

---

## tenant.prisma

```prisma
model Tenant {
  id            String   @id @default(cuid())
  fullName      String
  email         String?
  phone         String
  ktpNumber     String   @unique
  occupation    String?
  vehicleType   String? // "Motor Honda Beat", "Mobil Avanza" — jenis kendaraan
  vehiclePlate  String?
  isBlacklisted Boolean  @default(false)
  blacklistNote String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  contracts Contract[]

  @@map("tenants")
}

enum ContractStatus {
  ACTIVE
  ENDED
  CANCELLED
}

model Contract {
  id           String         @id @default(cuid())
  contractCode String         @unique // "GH-250001", generated on create

  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  roomId String
  room   Room   @relation(fields: [roomId], references: [id])

  status     ContractStatus @default(ACTIVE)
  rentPrice  Decimal        @db.Decimal(12, 2) // snapshot harga saat kontrak dibuat
  deposit    Decimal?       @db.Decimal(12, 2)
  startDate  DateTime
  endDate    DateTime?      // null = belum ditentukan / masih berjalan
  actualEndDate DateTime?   // tanggal keluar sebenarnya, diisi saat contract di-close
  notes      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  occupants ContractOccupant[]
  payments  Payment[]

  @@map("contracts")
}

// "Nama Penghuni Tambahan" dari narasi asli — orang yang tinggal
// bersama tapi bukan penanggung jawab kontrak (tidak perlu jadi Tenant sendiri)
model ContractOccupant {
  id         String @id @default(cuid())
  contractId String
  contract   Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  fullName   String
  relation   String? // "Adik", "Teman", dst — opsional

  @@map("contract_occupants")
}
```

**Constraint penting (application-level, bukan DB):** satu `Room` hanya boleh punya satu `Contract` dengan `status: ACTIVE` pada satu waktu. Divalidasi di service saat create contract — bukan di schema, karena Prisma tidak punya partial unique index lintas-provider yang portable.

**Generate `contractCode`:** Postgres sequence per tahun (`gh_contract_seq_2026`) dibuat lewat raw SQL migration, dibaca via `nextval()` di dalam transaction yang sama dengan `Contract.create`. Format string di service layer: `` `GH-${yy}${String(seq).padStart(4, '0')}` ``.

---

## payment.prisma

```prisma
enum PaymentStatus {
  PENDING   // belum jatuh tempo
  DUE       // menunggu pembayaran (jatuh tempo <= hari ini, belum lunas)
  PAID      // lunas
  OVERDUE   // terlambat (due date lewat, belum lunas)
}

model Payment {
  id         String        @id @default(cuid())
  contractId String
  contract   Contract      @relation(fields: [contractId], references: [id])

  periodMonth Int          // 1-12
  periodYear  Int
  amountDue   Decimal      @db.Decimal(12, 2)
  amountPaid  Decimal      @default(0) @db.Decimal(12, 2)
  dueDate     DateTime
  paidAt      DateTime?
  method      String?      // "Transfer BCA", "Tunai"
  note        String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([contractId, periodMonth, periodYear])
  @@map("payments")
}
```

`status` **tidak disimpan** — dihitung di service (`getPaymentStatus(payment, today)`): `PAID` jika `amountPaid >= amountDue`, lalu `PENDING` / `DUE` / `OVERDUE` berdasarkan jarak `dueDate` ke hari ini. Ini menghindari data basi (field status yang lupa di-update oleh cron).

Bukti pembayaran → `Attachment` (`entityType: "PAYMENT"`).

Reminder WhatsApp fase 1 tidak butuh tabel — template pesan cukup jadi konstanta di `src/config/` (lihat [02-modules-features.md](./02-modules-features.md#4-pembayaran)). Kalau nanti butuh multi-template yang admin-edit-sendiri, baru jadi `PaymentReminderTemplate` model.

---

## maintenance.prisma

```prisma
enum MaintenanceScope {
  ROOM
  BUILDING
}

model MaintenanceRecord {
  id       String           @id @default(cuid())
  scope    MaintenanceScope
  roomId   String?          // wajib jika scope = ROOM, null jika BUILDING
  room     Room?            @relation(fields: [roomId], references: [id])

  category String  // "AC", "Pompa Air", "Cat", dst — free text, master list di UI
  date     DateTime
  cost     Decimal? @db.Decimal(12, 2)
  vendor   String?
  notes    String?

  createdAt DateTime @default(now())

  @@map("maintenance_records")
}
```

Foto → `Attachment` (`entityType: "MAINTENANCE"`).

---

## incident.prisma

```prisma
enum IncidentCategory {
  PELANGGARAN_ATURAN
  GANGGUAN
  KERUSAKAN
  KEHILANGAN
  KELUHAN_PENGHUNI
  LAPORAN_SECURITY
}

enum IncidentStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
}

model Incident {
  id       String           @id @default(cuid())
  category IncidentCategory
  status   IncidentStatus   @default(OPEN)
  date     DateTime
  roomId   String?
  room     Room?            @relation(fields: [roomId], references: [id])
  location String?          // lokasi non-kamar, misal "Parkiran"
  description String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("incidents")
}
```

Foto → `Attachment` (`entityType: "INCIDENT"`).

---

## attachment.prisma

```prisma
enum AttachmentEntity {
  ROOM
  TENANT
  CONTRACT
  PAYMENT
  MAINTENANCE
  INCIDENT
}

enum AttachmentKind {
  PHOTO
  VIDEO
  DOCUMENT // KTP scan, kontrak PDF, dll
}

model Attachment {
  id         String           @id @default(cuid())
  entityType AttachmentEntity
  entityId   String
  kind       AttachmentKind
  url        String           // object storage URL (lihat catatan di bawah)
  label      String?          // "KTP Depan", "Foto Sebelum Perbaikan"
  createdAt  DateTime         @default(now())

  @@index([entityType, entityId])
  @@map("attachments")
}
```

> **Catatan infra:** butuh object storage (S3-compatible — Cloudflare R2 / Supabase Storage / UploadThing). Belum ada di stack saat ini. Ini keputusan yang perlu diambil sebelum modul upload dikerjakan — masuk sebagai open question di roadmap.

---

## audit.prisma

```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
}

model AuditLog {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  action     AuditAction
  entityType String      // "Contract", "Payment", dst — nama model
  entityId   String
  before     Json?
  after      Json?
  createdAt  DateTime    @default(now())

  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

Tambahkan back-relation `auditLogs AuditLog[]` di `user.prisma`.

---

## Ringkasan Relasi

```
User ──< AuditLog

Floor ──< Room ──< RoomFacility >── Facility
Room ──< Contract >── Tenant
Contract ──< ContractOccupant
Contract ──< Payment
Room ──< MaintenanceRecord
Room ──< Incident (nullable)

Attachment (polymorphic, tidak ada FK — entityType + entityId)
```

← [00-overview.md](./00-overview.md) | [02-modules-features.md](./02-modules-features.md) →
