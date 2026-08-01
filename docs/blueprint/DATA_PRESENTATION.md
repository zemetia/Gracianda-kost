# Data Presentation

← [Blueprint INDEX](./INDEX.md) | related: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [COMPONENTS.md](./COMPONENTS.md) · [DATABASE.md](./DATABASE.md)

**Single source of truth for how numbers are shown to users.** Every metric, KPI, total, saldo, tunggakan, occupancy rate, ratio, report figure, and chart follows it — no per-page reinterpretation.

Token source: [src/app/globals.css](../../src/app/globals.css) `@theme {}`. Read the actual file, not a summary — see the [token caveats](#0-token-caveats-read-first) below.

---

## 0. Token Caveats (read first)

This project's palette is **light**, warm, and forest-green — not the dark electric-blue baseline the template shipped with. Three consequences bind everything in this document:

| Fact | Consequence |
|---|---|
| `color-scheme: light`, `--color-background: oklch(0.967 …)` — warm off-white | Surfaces are barely distinguishable from the page (`--color-surface` is `0.988`). Borders are what makes a tile visible — which is exactly the crutch this paradigm removes. |
| `--color-success` is **byte-identical to `--color-primary`** (`oklch(0.444 0.113 125.6)`) | A positive delta pill reads as brand green. That is acceptable and intentional-looking; do **not** "fix" it by swapping in `text-primary`, and do not introduce a second green. If positive-vs-brand ever must be distinguished, add a dedicated token per [DESIGN_SYSTEM/02](./DESIGN_SYSTEM/02-typography-utilities.md#adding-a-new-color-token). |
| `--color-warning` is a light amber (`L 0.812`) | `text-warning` on a light surface fails contrast. A warning pill is `bg-warning-subtle` + `text-foreground`, never `text-warning`. `text-warning-foreground` is for text sitting *on* a warning fill. |

`--color-info` does not exist. Don't reach for `bg-info-subtle`.

> [DESIGN_SYSTEM/01-tokens-colors.md](./DESIGN_SYSTEM/01-tokens-colors.md) still describes the template's dark/electric-blue palette and is **stale**. Where the two disagree, `globals.css` wins.

---

## 1. The Paradigm

> Don't use traditional dashboard cards. Present metrics as **editorial-style financial highlights**. Typography is the primary visual hierarchy: large numbers, small muted labels, subtle inline comparisons, colored percentage pills, generous whitespace. The layout feels **integrated into the page**, not chopped into tiles.
>
> Avoid boxed statistic cards. Display metrics as clean **data blocks with no visible borders, fills, or shadows**. Hierarchy comes from typography, spacing, and alignment — never from containers.
>
> Build analytics with **editorial layout principles instead of dashboard widgets**. Numbers dominate. Labels are small and secondary. Supporting information — percentage change, comparison period, trend — appears **inline**, not in a separate card.
>
> References: Stripe Dashboard, Vercel Analytics, Linear, Apple financial reports. Minimal, elegant, typography-first. Every metric should read as part of a **financial report**, not as a widget.

One-line test before shipping a screen: *if you deleted every border and background, would the metrics still be readable and correctly ranked?* If yes, the hierarchy is real. If no, the containers were doing the work — fix the typography.

On this light palette that test is brutal, and that is the point: a `bg-surface` tile at `L 0.988` on a `L 0.967` page contributes almost no contrast, so today's dashboard tiles are held together entirely by `border` + `rounded-xl` + `shadow`. Delete those and nothing is left. Rebuild the ranking with size and space instead.

---

## 2. Hard Rules

| # | Rule | Violation looks like |
|---|---|---|
| 1 | A metric is **never** wrapped in a bordered/filled box | `<Card>` around one number; `rounded-xl border border-border p-4` |
| 2 | Hierarchy from **size, weight, color, space** only | Equal-size text separated by boxes |
| 3 | The **number is the largest element** in its block | Label or icon competing with the value |
| 4 | Labels are small, muted, uppercase, and sit **above** the value | `Typography variant="muted"` at default size as a label |
| 5 | Delta / comparison period is **inline**, adjacent to the value | A second tile titled "vs bulan lalu" |
| 6 | Metric groups separated by **space or a hairline**, not cards | `grid gap-4` of `<Card>` |
| 7 | Every numeral gets `tabular-nums` | Digits shifting between renders, ragged columns |
| 8 | Color via design tokens only ([hard constraint #5](./INDEX.md#hard-constraints)) | Raw hex/oklch, Tailwind palette utilities, `/40` opacity hacks on semantic fills |
| 9 | No decorative icon per metric; icons only when they carry meaning | `Icon` in a `rounded-lg bg-primary-subtle` square on every tile |
| 10 | No elevation on metric surfaces | `hover:shadow-md`, `glow-primary`, `border-gradient`, `shadow-primary-glow` |
| 11 | Whitespace generous and consistent — vertical rhythm beats density | Cramped `p-3` tiles |
| 12 | Metric text inherits the page face — Inter inside `/admin`, Outfit on public pages (see §8a) | `font-mono` on a KPI value — JetBrains Mono is for IDs, code, and hashes |
| 13 | Weight ceiling is `font-semibold` at metric sizes (`secondary` and up); money at row size is `font-bold` | `font-bold` on a hero figure — shouting; `font-medium` on a table amount — it disappears into the row |
| 14 | Metric values never use the `Typography` component | `<Typography variant="h3">Rp 12.400.000</Typography>` — headings and metrics are different scales |

---

## 3. Typographic Scale for Metrics

Fixed scale. Pick a tier by importance; do not invent intermediate sizes. This scale is **independent of `Typography`** — that component is for prose and headings; metrics use these classes directly.

| Tier | Use | Classes |
|---|---|---|
| Hero | The one number a page exists for (pendapatan bulan ini, total tunggakan) | `text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums` |
| Primary | Top-line metrics in a highlight row | `text-3xl font-semibold tracking-tight tabular-nums` |
| Secondary | Supporting metrics — per-lantai, per-kamar, per-properti | `text-2xl font-medium tracking-tight tabular-nums` |
| Inline | Numbers inside prose, tables, list rows | `text-sm font-medium tabular-nums` |
| Label | Every metric label | `text-xs font-medium uppercase tracking-wide text-foreground-muted` |
| Meta | Comparison period, source note, timestamp | `text-xs text-foreground-muted` |

Rules:
- `tracking-tight` on every value ≥ `text-2xl`; never on labels.
- Currency symbol and unit are **smaller and muted** next to the value, never the same size.
- `text-foreground-subtle` is placeholder/disabled only — a real metric label uses `text-foreground-muted`.

```tsx
<p className="text-3xl font-semibold tracking-tight tabular-nums">
  <span className="mr-1 text-lg font-normal text-foreground-muted">Rp</span>
  12.400.000
</p>
```

---

## 4. Anatomy of a Data Block

Order is fixed: **label → value → inline delta → meta**. No container element, no border, no fill, no padding of its own — spacing is owned by the parent layout.

```tsx
<div>
  <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
    Pendapatan Bulan Ini
  </p>
  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
    {formatRupiah(report.totalRevenue)}
  </p>
  <div className="mt-2 flex items-baseline gap-2">
    <DeltaPill value={4.2} />
    <span className="text-xs text-foreground-muted">vs bulan lalu</span>
  </div>
</div>
```

Optional trailing line for a secondary comparison — still inline, still muted:

```tsx
<p className="mt-1 text-xs text-foreground-muted">
  Rata-rata 6 bulan <span className="tabular-nums text-foreground">{formatRupiah(avg6m)}</span>
</p>
```

---

## 5. Linked Metrics

Every number on an admin dashboard is a question — "kamar kosong: 7" means "*which* 7?" — and per the fourth admin-flow principle in [THIS.md](../knowledge/THIS.md), every dashboard figure links to the pre-filtered list that answers it. **That affordance survives this paradigm; the card it currently lives in does not.**

```tsx
<Link
  href="/admin/master-data/rooms?status=VACANT"
  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
>
  <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted group-hover:text-foreground">
    Kamar Kosong
  </p>
  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums underline decoration-transparent underline-offset-4 transition group-hover:decoration-border-strong">
    7
  </p>
</Link>
```

Rules for linked metrics:
- Hover state lives on **type** — label brightening, value underline — never on a border, shadow, or background.
- The focus ring is the one exception to "no box": accessibility outranks aesthetics. Keep it tight (`rounded-xs`).
- The whole block is the hit target. No "Lihat detail →" link under the number.
- A metric that leads to a `<Forbidden />` page must not render at all — keep the existing role checks (`CAN_SEE_FINANCE` and friends) when converting a tile.

**Ordering.** Admin-flow principle #1 — antrean aksi di atas, statistik di bawah. The `ActionQueue` stays first; highlight rows sit below it. Converting tiles to data blocks must not promote statistics above the work queue.

---

## 6. Layout — Highlight Rows, Not Grids of Cards

A metric group is a **row of data blocks in shared whitespace**, optionally divided by hairlines.

```tsx
{/* Editorial highlight row — dividers, not cards */}
<section className="grid grid-cols-1 gap-8 border-y border-border py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border lg:[&>*:not(:first-child)]:pl-8">
  <MetricBlock label="Total Pendapatan"  value={formatRupiah(report.totalRevenue)} delta={4.2} period="vs periode lalu" />
  <MetricBlock label="Biaya Maintenance" value={formatRupiah(report.totalCost)}    delta={-3.1} period="vs periode lalu" goodWhen="down" />
  <MetricBlock label="Profit"            value={formatRupiah(report.profit)}       delta={7.5} period="vs periode lalu" />
  <MetricBlock label="Okupansi"          value="86,4%"                             delta={1.8} period="vs periode lalu" />
</section>
```

| Aspect | Rule |
|---|---|
| Separation | `divide-x divide-border` on `lg+`, pure `gap` below `lg` — never a border box per metric |
| Section framing | At most a single `border-y border-border` rule around a whole highlight row |
| Vertical rhythm | `py-8` inside a highlight row; `gap-10`–`gap-12` between page sections |
| Column count | 2–4 metrics per row. 5+ means the page has no point of view — rank and cut |
| Hero pattern | Lead with one hero metric on its own line, then a row of supporting metrics |
| Alignment | Left-aligned throughout. Right-align only inside numeric table columns |
| Page width | `PageWrapper` / `.container-page` owns width; metric sections are plain `<section>` children |
| Stacked rows | Every row after the first gets `-mt-px` so adjacent `border-y` hairlines collapse into one rule |
| Property scope | A figure scoped by `getPropertyScope()` states its scope once in the section header, not per metric |

---

## 7. Delta Pills

The only permitted colored surface in a metric block. Small, low-chroma, token-driven.

```tsx
<span className="inline-flex items-center gap-0.5 rounded-full bg-success-subtle px-1.5 py-0.5 text-xs font-medium tabular-nums text-success">
  <ArrowUpRight className="size-3" aria-hidden />
  4,2%
</span>
```

| Direction | Background | Text |
|---|---|---|
| Improvement | `bg-success-subtle` | `text-success` (= brand green, see §0) |
| Deterioration | `bg-destructive-subtle` | `text-destructive` |
| Needs attention (non-directional) | `bg-warning-subtle` | `text-foreground` — **never `text-warning`** |
| Flat (0 or below noise floor) | `bg-surface-raised` | `text-foreground-muted` |
| Unknown / no baseline | — | `text-foreground-muted`, render `—` |

Never append an opacity modifier to a subtle token (`bg-destructive-subtle/40`). The `-subtle` tokens already carry their alpha; stacking a second one produces an untokenized colour that drifts per usage.

**Direction ≠ sign.** For inverse metrics — tunggakan, biaya maintenance, hari kamar kosong, jumlah insiden, umur piutang — a negative percentage is an *improvement* and must render as success. Tone comes from a `goodWhen: 'up' | 'down'` prop, never from `value > 0`.

Other constraints: pill height must not exceed the label line-height; no pill on the label line; one pill per metric; render `0,0%` for flat, never hide it; never `NaN%`, `∞`, or a fake `100%` when the baseline is zero (a kost with no revenue last month is the normal case for a new property).

---

## 8. Number Formatting

All business figures are `id-ID`. Locale switches labels on public pages; it never changes number format.

| Case | Rule | Example |
|---|---|---|
| Locale | `id-ID` for every business figure | `12.400.000` |
| Currency | `formatRupiah()` — `Rp` prefix, no decimals | `Rp 12.400.000` |
| Compact (hero / row / chart labels only) | `formatRupiahShort()` — `jt` / `M`, one decimal; never in tables or exports | `Rp 12,4 jt` |
| Percentage | One decimal, comma separator, `%` attached | `86,4%` |
| Counts (kamar, kontrak, insiden) | Plain integer with `id-ID` grouping | `1.482` |
| Zero | `0`, styled `text-foreground-muted`; never `-` or blank | `0` |
| Null / not applicable | Em dash `—` in `text-foreground-muted` | `—` |
| Dates | `formatDate()` from `@/lib/utils` — never a second inline `toLocaleDateString` | `28 Jul 2026` |
| Alignment | `tabular-nums` everywhere; right-align numeric table columns | |
| Rounding | Round at the presentation layer only; services return exact values | |

**Money is `Prisma.Decimal`, not a number.** Convert at the service boundary with `.toNumber()` (as `report.service.ts` already does) and let the service return plain numbers. Never pass a `Decimal` into JSX, never call `.toLocaleString()` on one, and never test it for truthiness — `new Decimal(0)` is truthy. Compare `Number(x) > 0`.

**Format on the server.** Admin pages are Server Components reading Prisma through services, so formatting belongs in the service or the page body — the client should ship no formatting branch.

**One formatter, shared.** [src/lib/utils.ts](../../src/lib/utils.ts) exports `formatRupiah`, `formatRupiahShort`, `formatNumber`, `formatPercent`, and `formatDate` — the only implementations. Never redefine one locally, and never call `toLocaleString('id-ID')` in a component.

### 8a. Money renders through `Money`, not through a class list

[src/components/ui/Money/](../../src/components/ui/Money/) is the only place Rupiah gets its type
treatment. Call it anywhere an amount is *displayed* — table cell, footer total, list row, detail
pair, form preview:

```tsx
<TableCell className="text-right"><Money value={expense.amount.toNumber()} /></TableCell>
<TableCell className="text-right"><Money value={total} size="total" /></TableCell>
```

| Prop | Use |
|---|---|
| `size` | `hero` · `primary` · `secondary` — metric tiers, `font-semibold`; `total` — table footers; `inline` (default) — rows and cells, `font-bold`; `meta` — hints and captions |
| `tone` | `default` · `muted` · `primary` · `destructive` · `success`. Omit it and zero mutes itself |
| `short` | `Rp 12,4 jt` — hero figures and chart labels only |
| `signed` | Renders `+` on positives, for cash flow and selisih |
| `muteZero` | `false` keeps a zero at full weight when it is the point of the column |

Two rules it encodes, so no page re-decides them: **`Rp` is a unit** — always one size step down,
`font-normal`, `text-foreground-muted`, never the same weight as the digits; and **the digits carry
the weight** — `font-bold` at row size, where `font-medium` sinks into the label beside it.

`null` / `undefined` renders `—` muted, so a missing amount needs no ternary at the call site.
`formatRupiah()` stays the formatter for *strings* — WhatsApp templates, `CardDescription` prose,
`aria-label`, dialog copy. Never hand-build a money `<span>` again.

**Language.** Admin surfaces are Indonesian copy written inline — there are no admin translation namespaces (`messages/*` covers `common`, `home`, `navigation` only). Don't invent translation keys for admin metric labels; do use next-intl for anything on the public site.

---

## 9. Tables

Tables are data, not widgets — same paradigm.

- Header cells: `text-xs font-medium uppercase tracking-wide text-foreground-muted`.
- Row separation: hairline `border-b border-border` only. No zebra striping, no per-row fill.
- Numeric columns: `text-right tabular-nums`.
- A table may live inside `Card` (a *container for a dataset* is allowed — §11), but individual figures inside it never get their own boxes.
- Totals / subtotals: `font-semibold` + `border-t border-border`, not a fill.
- Status uses `Badge` sized like a delta pill — don't invent a second status vocabulary.
- Row-level actions stay in the row (admin-flow principle #2) — a table that forces a detail-page round-trip to act is a regression, not a cleanup.

---

## 10. Charts

Charts support the number; they never replace it.

- Always pair a chart with its headline value in the section header, styled per §3. [RevenueChart](../../src/app/%5Blocale%5D/admin/RevenueChart.tsx) currently renders six bars with no headline total — the section must state the period total above it.
- Chrome minimum: no chart border, no background fill, no visible box. Hand-rolled SVG (the house style here) makes this easy — keep it.
- Gridlines / baseline: horizontal only, `stroke-border`, or none.
- Axis labels: `fill-foreground-muted` at `text-[10px]`–`text-xs`; drop the axis title when the label already says it.
- Series color: `fill-primary` / `stroke-primary` for the focus series, `fill-foreground-muted` for comparison or baseline. Semantic colors only when the series *is* a status (tunggakan, insiden).
- Bar tracks, when needed: `fill-surface-raised`. No gradients.
- Keep the `<title>` element per data point — it is the tooltip and the accessible label. Format its number with `formatRupiah`.

---

## 11. When a Container *Is* Allowed

The ban targets metrics-in-boxes, not all surfaces.

| Allowed | Not allowed |
|---|---|
| A dataset region — table, list, audit log — via `Card` | A single number via `Card` |
| Forms, dialogs, pickers (`Combobox`), filter bars | A KPI "widget" grid |
| The `ActionQueue` — it is a work list, not a metric | A metric wrapped for "visual grouping" |
| Error panels, `<Forbidden />`, banners, toasts | A stat given a border to "separate" it — use space |

If a container holds exactly one number, it is a violation. Remove the container.

### 11a. Input is carded; output is not

Admin **data entry** deliberately uses raised cards — `FormCard` groups the fields of one decision,
lifted off the page with `shadow-card`. That is not a contradiction of this document: a form is a
place where work happens, and a container that says "these fields belong together" is doing real
work. A metric is a *reading*, and a box around a reading only adds weight.

The line, concretely:

| Carded | Not carded |
|---|---|
| `FormCard` around a group of inputs | `MetricBlock`, `MetricRow`, `MetricInline` |
| A form's sticky submit bar | A number on a dashboard, report, or confirmation step |
| A filter bar wrapping a form | A total at the foot of a table |

`NewContractForm` shows both in one screen: steps 1 and 2 are cards of inputs, step 3 is the
confirmation — bare `MetricInline` rows with no container at all.

---

## 12. States

Skeletons mirror the typography, not a box:

```tsx
<div>
  <div className="h-3 w-24 animate-pulse rounded bg-surface-raised" />
  <div className="mt-3 h-8 w-40 animate-pulse rounded bg-surface-raised" />
</div>
```

- **Empty:** render the label and `—` at full metric size, with a muted one-line reason. Never collapse the block — a missing metric keeps its slot so the row doesn't reflow.
- **Error:** keep the label, render `—`, and surface the failure once at section level, not per metric.
- **Stale:** append a muted meta line — `Per 28 Jul 2026, 14:05`.
- **New property with no history:** this is *empty*, not *zero* — a property onboarded mid-month shows `—` for "vs bulan lalu", not `0,0%`.

---

## 13. The Primitives

**Built** — [src/components/ui/Metric/](../../src/components/ui/Metric/), exported from the `ui` barrel. Use them instead of hand-rolling a metric surface.

| Export | Use |
|---|---|
| `MetricRow` | Highlight row: `columns` 2–4, `divided` hairlines, `bordered` border-y, `stacked` collapses the hairline into the row above |
| `MetricBlock` | One data block — `label`, `value`, `prefix`, `suffix`, `delta`, `goodWhen`, `period`, `meta`, `href`, `size`, `tone` |
| `MetricValue` | Bare number when you need custom composition around it |
| `MetricLabel` | The one label style (small, muted, uppercase) |
| `DeltaPill` | Percentage pill; `goodWhen: 'up' \| 'down'` decides the tone, `null` renders `—` |
| `MetricInline` | Compact label-left / value-right row for narrow panels and detail pages |
| `MetricSkeleton` | §12 loading state — mirrors the typography, not a box |
| `Money` | Every displayed Rupiah amount — see §8a |

`delta` is omitted entirely when there is nothing to compare; pass `null` when a baseline is expected but missing (new property, zero last month) so the block still renders `—` and keeps its slot.

Constraints from [COMPONENTS.md](./COMPONENTS.md):
- `ui/` layer — no domain logic, no i18n, no stores. Labels and formatted values arrive as props; `getPropertyScope`, services, and role checks stay in the page.
- `href` on `MetricBlock` renders the §5 linked-metric pattern via `Link` from `@/i18n/navigation` — never `next/navigation`.
- `size` / `tone` variants via CVA, `cn()` last, `displayName` on every export.
- No `'use client'` — these are pure presentational Server Components.

---

## 14. Migration Status

Converted (2026-07-31): admin dashboard, all four report pages, payment detail, room detail history,
`CheckoutForm`, `RevenueChart` (headline total added), and every local `formatRupiah` /
`formatRupiahShort` / `rupiah` copy — the formatters now live only in [src/lib/utils.ts](../../src/lib/utils.ts).

Still on the old pattern; fix as each page is touched, and do not copy these into new pages:

| File | Violation |
|---|---|
| [admin/contracts/[id]/page.tsx](../../src/app/%5Blocale%5D/admin/contracts/%5Bid%5D/page.tsx) | Money and dates via inline `toLocaleString('id-ID')`, figures inside `<Card>` grids |
| [admin/payments/page.tsx](../../src/app/%5Blocale%5D/admin/payments/page.tsx) · [admin/maintenance/page.tsx](../../src/app/%5Blocale%5D/admin/maintenance/page.tsx) · [admin/master-data/rooms/page.tsx](../../src/app/%5Blocale%5D/admin/master-data/rooms/page.tsx) | List tables with `bg-surface-raised` headers instead of the §9 hairline style; some inline date formatting remains |
| [admin/audit-log/page.tsx](../../src/app/%5Blocale%5D/admin/audit-log/page.tsx) | Inline `toLocaleString('id-ID')` on timestamps — use `formatDate` |
| [lib/whatsapp.ts](../../src/lib/whatsapp.ts) | Message templates build Rupiah by hand — acceptable for now (plain-text output), but reuse `formatRupiah` when touched |

---

## 15. Review Checklist

- [ ] No metric sits inside a bordered or filled box
- [ ] The number is visually dominant; label is small, muted, uppercase, above it
- [ ] Linked metrics keep their `href`, with hover on type — not on a border or shadow
- [ ] `ActionQueue` still precedes the statistics
- [ ] Delta and comparison period are inline with the value
- [ ] Delta pill tone reflects *good/bad*, not the sign of the number
- [ ] `tabular-nums` on every numeral, including table cells
- [ ] All color via tokens; no `/40`-style opacity stacked on `-subtle` tokens; no `text-warning` as body text
- [ ] `Decimal` converted with `.toNumber()` in the service; no truthiness checks on money
- [ ] Figures formatted `id-ID` via the shared `formatRupiah`; zero renders `0`, missing renders `—`
- [ ] No new local copy of a formatter
- [ ] Loading / empty states preserve the block's slot and shape
- [ ] Row holds at most 4 metrics and the page leads with a clear hero figure
- [ ] `npm run lint` exits 0

---

← [Blueprint INDEX](./INDEX.md)
