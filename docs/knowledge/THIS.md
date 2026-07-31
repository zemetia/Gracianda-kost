# THIS — Project & Developer Knowledge

> Living document. Updated by AI whenever a new insight, pattern, or preference is discovered about this project or developer. Do not delete entries — mark outdated ones with `~~strikethrough~~`.

---

## Developer Profile

- Builds with Next.js 16, TypeScript (strict), Tailwind v4 — expects production-grade quality
- Cares deeply about architecture cleanliness and separation of concerns
- Wants concise AI responses — no fluff, no over-explanation
- Prefers dark design systems with strong token discipline

---

## Project Identity

- Template repo — the patterns here become the standard for all derived projects
- Blueprint docs in `docs/blueprint/` are the single source of truth; AI must read them before planning
- Knowledge docs in `docs/knowledge/` capture learned behavior that is *not* in the code

---

## Do's

- Always read relevant blueprint section before planning any change
- Use `@/i18n/navigation` for all routing — never `next/navigation`
- Keep components Server Components by default; add `'use client'` only when required
- Use design tokens exclusively for color — no raw hex/oklch/Tailwind palette utilities
- Every public page needs `buildMetadata()` + `<StructuredData>` — check `SEO_GEO_LLM.md`
- Follow the four-file rule for UI components: impl, stories, test, barrel
- Write compact, high-signal code — no unnecessary comments or abstractions
- Run `npm run lint` (must exit 0) before declaring any task done

---

## Don'ts

- Don't use `useState` for server data — TanStack Query only
- Don't call `fetch` or `apiClient` directly in components — always go through services
- Don't add root `proxy.ts` — use `src/middleware.ts` (export `middleware`) + `src/proxy/` modules instead
- Don't write raw hex colors, oklch values, or Tailwind color utilities in components
- Don't add error handling for impossible cases — only validate at system boundaries
- Don't create README or documentation files unless explicitly asked
- Don't use emojis unless the user explicitly requests them
- Don't summarize what was just done — the user can read the diff

---

## Insights

<!-- Add dated insights here as they are discovered -->
<!-- Format: `[YYYY-MM-DD] insight` -->

- [2026-07-31] `Facility.icon` menyimpan **nama icon lucide-react dalam kebab-case** (mis. `snowflake`, `bed-double`), bukan JSX/emoji — verifikasi nama ke `node_modules/lucide-react/dist/esm/icons/<name>.mjs` sebelum dipakai karena banyak nama intuitif tidak ada (`mirror`, `wardrobe`, `curtains`, `stairs`, `hanger`, `fingerprint`). Master fasilitas dipisah `FacilityCategory` = `COMMON` (fasilitas umum properti) vs `ROOM` (fasilitas kamar); daftar bakunya ada di `prisma/seed.ts` dan idempotent lewat `upsert` by `name`
- [2026-07-31] **Rombak total UI input.** Developer menilai form admin "sangat jelek, gak modern" dan memilih arah **kartu terangkat**: `FormCard` (bg-card + `shadow-card`, header di dalam kartu, field lebar penuh) menggantikan `FormSection`, halaman form `max-w-5xl`, bar simpan `FormStickyBar` menempel di bawah viewport. Semua kontrol native diganti kontrol kustom — `CurrencyInput` (tampil `1.500.000`, kirim `1500000`), `Select` sebagai listbox asli (bukan `<select>`), `DatePicker` berbahasa Indonesia, `Combobox` (angkatan dari `SearchablePicker`), `Checkbox`/`Radio`/`SegmentedControl`/`ChipToggle`. Semuanya menulis nilai ke hidden input supaya `<form action={serverAction}>` tidak berubah. Substrat bersamanya di `src/components/ui/Field/` (`fieldShellVariants` + `Field` + `useFieldIds`) — tinggi field default naik ke `h-11`. `className` sekarang jatuh ke **wrapper** (tempat `sm:col-span-2`), kontrolnya pakai `inputClassName`/`textareaClassName`
- [2026-07-31] Batas doktrin kartu: **input dikartukan, metrik tidak**. `FormCard` untuk grup field; `Metric*` tetap blok tipografis tanpa border/fill. `NewContractForm` menunjukkan keduanya dalam satu layar — step 1–2 kartu input, step 3 konfirmasi berupa `MetricInline` telanjang. Ditulis di `DATA_PRESENTATION.md` §11a
- ~~[2026-07-31] Primitif `Metric*` (`MetricRow`/`MetricBlock`/`MetricValue`/`MetricLabel`/`DeltaPill`/`MetricInline`/`MetricSkeleton`) dan keluarga layout form (`FormLayout`/`FormSection`/`FormGrid`/`FormField`/`FormActions`/`FormError`) plus `Select`/`Textarea`/`Checkbox` sudah dibuat di `src/components/ui/`. Form admin memakai pola editorial: judul+deskripsi section di kolom kiri (`lg+`), field di kanan, dipisah hairline — bukan `<Card>` per grup field, dan halaman form lebarnya `max-w-4xl` (bukan `max-w-2xl` yang memotong kolom judul). `className` pada `Input`/`Select` jatuh ke elemen kontrol, bukan wrapper — untuk `col-span` bungkus dengan `div`~~ (bagian `Metric*` masih berlaku; pola form editorial digantikan entri di atas)
- [2026-07-31] Paradigma penyajian data (dari proyek Pusat Valas, kini standar di sini juga): metrik adalah blok data tipografis tanpa border/fill — bukan stat card. Spec di `docs/blueprint/DATA_PRESENTATION.md`, disesuaikan ke palet nyata proyek ini (light, hijau forest; `--color-success` identik dengan `--color-primary`; `text-warning` terlalu terang untuk teks), `tabular-nums` (tidak ada utility `.tabular`), `Prisma.Decimal` → `.toNumber()` di service, dan admin berbahasa Indonesia inline tanpa namespace i18n. Prinsip "setiap angka adalah link" tetap dipertahankan lewat pola linked metric (§5) — yang dihapus kartunya, bukan href-nya. Primitif `Metric*` belum dibuat; §14 mendata halaman yang masih memakai stat card
- [2026-07-28] Empat prinsip flow admin (dipakai sebagai acuan setiap halaman admin baru): (1) sistem yang mengingatkan — antrean aksi di atas, statistik di bawah; (2) aksi ada di baris tempat datanya terlihat, bukan 2 klik ke halaman detail; (3) satu niat bisnis = satu tombol (Perpanjang / Pindah Kamar / Check-out, bukan "tutup lalu buat baru"); (4) setiap angka di dashboard adalah link ke list yang sudah terfilter
- [2026-07-28] Identitas periode tagihan adalah `Payment.periodStart`, bukan bulan kalender — `periodMonth/periodYear` tinggal kunci denormalisasi untuk laporan. Konsekuensinya kontrak harian/mingguan punya banyak periode dalam satu bulan dan akhirnya bisa ditagih; jatuh tempo memakai tanggal anniversary kontrak, bukan tanggal 5 global
- [2026-07-28] Aturan periode tagihan murni ada di `src/lib/billing.ts` (tanpa import prisma) supaya service dan unit test memakai implementasi yang sama — sebelumnya logikanya disalin ke file test dan berpotensi menyimpang
- [2026-07-28] Konteks properti aktif adalah state global admin: cookie `admin_property_id` lewat `getPropertyScope()` di `src/lib/property-scope.ts`, switcher di `admin/layout.tsx`. Halaman list tetap menerima `?propertyId` sebagai override eksplisit (deep link dari action queue) — pola: `getPropertyScope(searchParamPropertyId)`
- [2026-07-28] Untuk daftar panjang (penyewa/kamar) pakai `Combobox` di `src/components/ui/Combobox/` (dulu `SearchablePicker` lokal di `admin/contracts/`; ketik-untuk-filter + hidden input), bukan `<select>` — `<select>` berisi seluruh penyewa berhenti berguna di ~50 baris. Blacklist ditangani sebagai peringatan + checkbox konfirmasi yang mengunci tombol submit, bukan blokir keras

- [2026-07-28] Widget dashboard yang berisi angka/aksi harus di-gate memakai daftar role yang sama persis dengan layout guard halaman tujuannya — item antrean yang bisa dilihat tapi berujung `<Forbidden />` lebih buruk daripada tidak ditampilkan
- [2026-07-29] Sidebar admin memakai gaya ERP: baris nav tinggi tetap `h-11` (bukan `py-2`), penanda aktif berupa accent bar `bg-primary` di tepi kiri + `bg-primary-subtle`, dan collapse-to-icon-rail (`w-[4.5rem]`) yang dipersist di `admin_sidebar_collapsed`. Animasi buka/tutup section pakai trik `grid-rows-[1fr]`↔`[0fr]` — bukan `max-h-[...]` yang harus ditebak dan memotong section panjang
- [2026-07-28] Redesign halaman landing page public dengan UI bertumpuk (Stacked Floor Plan) untuk simulasi gedung hunian kost riil serta memperkaya section dengan visual premium nyata.

- [2026-06-06] Developer explicitly designed a two-tier learning system: THIS.md for general knowledge, LEARN.md for corrections — treat both as first-class project docs
- [2026-07-27] Pola guard route admin: `canAccess()` + `<Forbidden />` di layout/page, `requireRole()` (throw) di Server Action — jangan campur
- [2026-07-27] Entity yang punya relasi ke `AuditLog` (mis. `User`) tidak boleh hard delete — FK restrict akan menolak dan jejak audit hilang; pakai flag `isActive` seperti `Room`
- [2026-07-27] Rahasia (password, token) tidak pernah masuk payload `AuditLog` — cukup flag seperti `passwordChanged: true`
- [2026-07-27] Developer tidak mau container proyek lain diganggu saat port bentrok — pilih pindahkan port proyek ini (Postgres lokal sekarang di `5434`, bukan `5433`)
