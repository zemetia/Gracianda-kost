# LEARN — Correction & Mistake Log

> Written whenever: (1) the user explicitly corrects the AI, or (2) the AI recognizes it deviated from what was asked or from best practice. Format is compact but lossless.

**Template:** `[YYYY-MM-DD] - [problem] - [solution] - [lesson]`

---

<!-- Entries below, newest first -->

[2026-07-27] - Import 'buildRoomInquiryMessage' di RoomFloorPlan.tsx tidak digunakan dan memicu kegagalan type-check compiler strict - Hapus import yang tidak terpakai dan bersihkan kode - Selalu bersihkan import yang tidak terpakai agar tsc --noEmit keluar dengan exit code 0

[2026-07-27] - `requireRole()` dipakai langsung di page/layout admin, padahal fungsi itu `throw new Error('Forbidden')` — role yang tidak berhak dapat error boundary (500), bukan 403; dan di production `error.message` diredaksi jadi tidak bisa dibedakan dari crash biasa - Tambah `canAccess()` (non-throwing) di `src/lib/auth.ts` + komponen `<Forbidden />`; page/layout pakai `canAccess`, Server Action tetap pakai `requireRole` - Guard di UI dan guard di mutasi punya kebutuhan berbeda: UI harus merender penolakan, mutasi harus gagal keras

[2026-07-27] - `/admin/master-data/*` (kamar, fasilitas, promo) tidak punya layout guard sama sekali sejak Fase 1 — semua role bisa membuka list-nya, hanya Server Action mutasinya yang dijaga `requireRole` - Tambah `master-data/layout.tsx` → `SUPER_ADMIN|OPERASIONAL` - Setiap kali menambah section admin baru, guard route (layout) dan guard mutasi (action) harus dipasang berpasangan; jangan anggap guard mutasi sudah cukup

[2026-07-27] - 11 Server Action mutasi dari Fase 1-3 tidak menulis `AuditLog` (create/remove facility & promo, create floor, semua upload/hapus attachment, set blacklist) — jejak audit bolong padahal `auditService.log()` sudah ada sejak Fase 2 - Dilengkapi semua di Fase 6 - Audit log itu cross-cutting: tulis bersamaan dengan aksinya, bukan ditambal di fase belakangan; upload/hapus file juga mutasi data yang perlu tercatat

[2026-06-09] - Template used root `proxy.ts` (Next.js 16 rename of middleware.ts), which has confirmed production-mode bugs (#85711), Windows 11 `next start` failure (#85243), and Cloudflare/pageExtensions breakage (#86122, #86303) — reverted to `src/middleware.ts` with `export function middleware` — never use root `proxy.ts` in this template; always use `src/middleware.ts`; the `src/proxy/` modules folder is fine to keep

[2026-06-09] - i18n routing used `localePrefix: 'as-needed'` so the default locale had no URL prefix — `/about` served English without redirecting to `/en/about`, violating the "all routes must have a locale prefix" requirement; also `PostHogProvider` used `usePathname`/`useSearchParams` from `next/navigation` breaking the non-negotiable; blueprint docs documented the wrong localePrefix and still showed a deprecated `middleware.ts` example - Fixed `localePrefix` to `'always'`, fixed PostHog to use `@/i18n/navigation` + `useLocale`, and rewrote the blueprint sections - `localePrefix` must be `'always'`; never import from `next/navigation` even in analytics/provider files; blueprint must document `proxy.ts` not `middleware.ts`

[2026-06-06] - Pushed commits to `master` without first checking the repo's default branch (`main`), creating diverged histories - Merged `master` → `main` with `--allow-unrelated-histories`, pushed to `origin/main` - Always check the default branch before the first push; never assume it is `master`
