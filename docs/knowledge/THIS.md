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

- [2026-07-28] Empat prinsip flow admin (dipakai sebagai acuan setiap halaman admin baru): (1) sistem yang mengingatkan — antrean aksi di atas, statistik di bawah; (2) aksi ada di baris tempat datanya terlihat, bukan 2 klik ke halaman detail; (3) satu niat bisnis = satu tombol (Perpanjang / Pindah Kamar / Check-out, bukan "tutup lalu buat baru"); (4) setiap angka di dashboard adalah link ke list yang sudah terfilter
- [2026-07-28] Identitas periode tagihan adalah `Payment.periodStart`, bukan bulan kalender — `periodMonth/periodYear` tinggal kunci denormalisasi untuk laporan. Konsekuensinya kontrak harian/mingguan punya banyak periode dalam satu bulan dan akhirnya bisa ditagih; jatuh tempo memakai tanggal anniversary kontrak, bukan tanggal 5 global
- [2026-07-28] Aturan periode tagihan murni ada di `src/lib/billing.ts` (tanpa import prisma) supaya service dan unit test memakai implementasi yang sama — sebelumnya logikanya disalin ke file test dan berpotensi menyimpang
- [2026-07-28] Konteks properti aktif adalah state global admin: cookie `admin_property_id` lewat `getPropertyScope()` di `src/lib/property-scope.ts`, switcher di `admin/layout.tsx`. Halaman list tetap menerima `?propertyId` sebagai override eksplisit (deep link dari action queue) — pola: `getPropertyScope(searchParamPropertyId)`
- [2026-07-28] Untuk daftar panjang (penyewa/kamar) pakai `SearchablePicker` (ketik-untuk-filter + hidden input), bukan `<select>` — `<select>` berisi seluruh penyewa berhenti berguna di ~50 baris. Blacklist ditangani sebagai peringatan + checkbox konfirmasi yang mengunci tombol submit, bukan blokir keras

- [2026-07-28] Widget dashboard yang berisi angka/aksi harus di-gate memakai daftar role yang sama persis dengan layout guard halaman tujuannya — item antrean yang bisa dilihat tapi berujung `<Forbidden />` lebih buruk daripada tidak ditampilkan
- [2026-07-29] Sidebar admin memakai gaya ERP: baris nav tinggi tetap `h-11` (bukan `py-2`), penanda aktif berupa accent bar `bg-primary` di tepi kiri + `bg-primary-subtle`, dan collapse-to-icon-rail (`w-[4.5rem]`) yang dipersist di `admin_sidebar_collapsed`. Animasi buka/tutup section pakai trik `grid-rows-[1fr]`↔`[0fr]` — bukan `max-h-[...]` yang harus ditebak dan memotong section panjang
- [2026-07-28] Redesign halaman landing page public dengan UI bertumpuk (Stacked Floor Plan) untuk simulasi gedung hunian kost riil serta memperkaya section dengan visual premium nyata.

- [2026-06-06] Developer explicitly designed a two-tier learning system: THIS.md for general knowledge, LEARN.md for corrections — treat both as first-class project docs
- [2026-07-27] Pola guard route admin: `canAccess()` + `<Forbidden />` di layout/page, `requireRole()` (throw) di Server Action — jangan campur
- [2026-07-27] Entity yang punya relasi ke `AuditLog` (mis. `User`) tidak boleh hard delete — FK restrict akan menolak dan jejak audit hilang; pakai flag `isActive` seperti `Room`
- [2026-07-27] Rahasia (password, token) tidak pernah masuk payload `AuditLog` — cukup flag seperti `passwordChanged: true`
- [2026-07-27] Developer tidak mau container proyek lain diganggu saat port bentrok — pilih pindahkan port proyek ini (Postgres lokal sekarang di `5434`, bukan `5433`)
