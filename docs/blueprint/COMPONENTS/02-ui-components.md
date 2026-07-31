# Components — 02: Existing UI Components

← [01 — Layers, CVA](./01-structure-cva.md) | [COMPONENTS.md](../COMPONENTS.md) | [03 — Storybook, tests, shadcn →](./03-storybook-tests-shadcn.md)

---

## Simple Components (no CVA)

For structural components with no variants:

```ts
// src/components/ui/Card/Card.tsx
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card text-card-foreground p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}
Card.displayName = 'Card';
```

---

## Button — [src/components/ui/Button/](../../../src/components/ui/Button/)

| Prop | Type | Values |
|---|---|---|
| `variant` | CVA | `primary` \| `secondary` \| `outline` \| `ghost` \| `destructive` \| `link` |
| `size` | CVA | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `icon` \| `icon-sm` \| `icon-lg` |
| `isLoading` | boolean | disables + shows spinner |
| `leftIcon` | ReactNode | icon slot before label |
| `rightIcon` | ReactNode | icon slot after label |
| `fullWidth` | boolean | `w-full` |

---

## Field — [src/components/ui/Field/](../../../src/components/ui/Field/)

The shared substrate every data-entry control is built on. Nothing else defines a field's
height, radius, fill, border or focus ring.

| Export | Use |
|---|---|
| `Field` | Label / control / hint / error frame. `error` replaces `hint`, never stacks with it |
| `useFieldIds(id, {hasHint, hasError})` | Stable ids via `useId` — never derive an id from a label, two fields can share one |
| `fieldShellVariants` | CVA for the box: `fieldSize` `sm` (h-9) \| `md` (h-11, default) \| `lg` (h-12) \| `auto` (multi-line); `fieldState` `default` \| `error` |
| `fieldControlClass` | The bare control inside the shell — transparent, borderless |
| `fieldAffixClass` | Static text glued to a value (`Rp`, `m²`) |

**Which control for which data**

| Data | Control | Never |
|---|---|---|
| Free text, numbers, email | `Input` | — |
| Money | `CurrencyInput` | `Input type="number" leftAddon="Rp"` |
| A date | `DatePicker` | `Input type="date"` |
| One of a short fixed list | `Select` | native `<select>` |
| One of 2–4 choices that reshape the form | `SegmentedControl` | hand-rolled radio pills |
| One of a long list (tenants, rooms) | `Combobox` | `Select` — it stops being usable at ~50 rows |
| One of a few options, all worth reading | `RadioGroup` | native radios |
| A single on/off | `Checkbox` | native checkbox styling |
| Many-of-many, scannable (facilities) | `ChipGroup` + `ChipToggle` | a grid of checkboxes |
| Long prose | `Textarea` | — |

Every popover control (`Select`, `Combobox`, `DatePicker`) writes its value to a hidden input, so
a plain `<form action={serverAction}>` keeps working with no change to `actions.ts`.

---

## Input — [src/components/ui/Input/](../../../src/components/ui/Input/)

| Prop | Type | Notes |
|---|---|---|
| `size` | `sm` \| `md` \| `lg` | field shell height |
| `label` | string | renders `<label>` with htmlFor wired |
| `hint` | ReactNode | helper text below |
| `error` | string | error text; sets `aria-invalid`, `aria-describedby` |
| `leftAddon` / `rightAddon` | ReactNode | glued inside the shell, not floating over it |
| `required` | boolean | `required` + visual indicator |
| `className` | string | **the wrapper** — this is where `sm:col-span-2` goes |
| `inputClassName` | string | the `<input>` itself; rarely needed |

---

## CurrencyInput — [src/components/ui/CurrencyInput/](../../../src/components/ui/CurrencyInput/)

Displays `1.500.000` while the user types; submits `1500000` through a hidden input. `Rp` sits
inside the shell as an affix. No spinners — `input[type=number]` spinners are killed globally in
`globals.css`.

| Prop | Type | Notes |
|---|---|---|
| `name` | string | the hidden input's name |
| `value` / `defaultValue` | `number \| ''` | `''` is empty, which is not `0` |
| `onValueChange` | `(v: number \| '') => void` | receives the parsed number |

Also exports `parseRupiah` / `formatRupiahInput` for tests and callers.

---

## DatePicker — [src/components/ui/DatePicker/](../../../src/components/ui/DatePicker/)

Indonesian calendar (`31 Jul 2026` in the trigger, Monday-first grid) that submits `YYYY-MM-DD` —
identical to what a native date input sends, so no action changes. Supports `min` / `max`.

Also exports `toISODate` / `fromISODate` / `formatDisplayDate`. Use `toISODate(new Date())` rather
than `.toISOString().split('T')[0]` — the latter shifts a WIB date back a day.

---

## Select — [src/components/ui/Select/](../../../src/components/ui/Select/)

A real listbox, not a native `<select>`. Full keyboard support: ↑↓, Home/End, type-to-jump, Enter,
Escape. Options carry an optional second line.

| Prop | Type | Notes |
|---|---|---|
| `options` | `SelectOption[]` | `{ value, label, hint?, disabled? }` — never `<option>` children |
| `value` / `defaultValue` | string | controlled or not |
| `onValueChange` | `(v: string) => void` | |
| `placeholder` | string | shown when nothing is chosen |
| `allowEmpty` | boolean | adds a leading blank row so the value can be cleared |
| `size` | `sm` \| `md` \| `lg` | |
| `className` | string | the wrapper — grid spans go here |

---

## Combobox — [src/components/ui/Combobox/](../../../src/components/ui/Combobox/)

Type-to-filter picker for lists too long for a `Select`. Filters on both label and hint, so a
tenant is findable by name, KTP or phone. `flag` renders a destructive marker (blacklist).

---

## Textarea — [src/components/ui/Textarea/](../../../src/components/ui/Textarea/)

| Prop | Type | Notes |
|---|---|---|
| `label` / `hint` / `error` | | same contract as `Input` |
| `rows` | number | defaults to `3` |
| `className` / `textareaClassName` | string | wrapper vs control |

---

## Checkbox / Radio — [src/components/ui/Checkbox/](../../../src/components/ui/Checkbox/), [src/components/ui/Radio/](../../../src/components/ui/Radio/)

Custom boxes, not `accent-primary` on a native control. `Checkbox` supports `indeterminate`.
`RadioGroup` owns the label and the error for the whole question; the individual `Radio`s never do.

---

## SegmentedControl — [src/components/ui/SegmentedControl/](../../../src/components/ui/SegmentedControl/)

2–4 mutually exclusive choices that change what the rest of the form asks for. Radios underneath,
so keyboard and form submission behave like radios. Pass `name` to submit it.

---

## Chip — [src/components/ui/Chip/](../../../src/components/ui/Chip/)

`ChipGroup` + `ChipToggle` — many-of-many selection as togglable pills. Use for facilities; twenty
identical checkboxes is a wall, twenty chips is scannable.

---

## PageHeader — [src/components/ui/PageHeader/](../../../src/components/ui/PageHeader/)

The one page title treatment for admin: `h1` + description + optional back link + action slot.
Never hand-roll `Typography variant="h2"` + `variant="muted"` on a page again.

---

## Form — [src/components/ui/Form/](../../../src/components/ui/Form/)

Layout family for admin forms. **Input is carded; metrics are not** — see
[DATA_PRESENTATION.md](../DATA_PRESENTATION.md) for the other side of that line.

| Export | Use |
|---|---|
| `FormLayout` | Vertical rhythm wrapper — `gap-6` between cards |
| `FormCard` | `<fieldset>` raised off the page: header inside the card, fields at full card width |
| `FormGrid` | Field grid, `columns` 1–3; a full-width field gets `sm:col-span-2` |
| `FormField` | Alias of `Field` — kept so callers don't have to care that it moved |
| `FormStickyBar` | Submit bar pinned to the viewport bottom; use on any form longer than a screen |
| `FormActions` | Static submit row for short inline forms |
| `FormError` | Form-level failure, surfaced once above the actions |

Form pages are `max-w-5xl`. `FormCard` replaced the old `FormSection`, whose 16rem title column
squeezed the fields it was meant to introduce.

---

## Metric — [src/components/ui/Metric/](../../../src/components/ui/Metric/)

The primitives behind [DATA_PRESENTATION.md](../DATA_PRESENTATION.md). Read that document before
using them: metrics never sit in a bordered or filled box.

| Export | Use |
|---|---|
| `MetricRow` | Highlight row — `columns` 2–4, `divided`, `bordered`, `stacked` |
| `MetricBlock` | One data block — `label`, `value`, `prefix`, `suffix`, `delta`, `goodWhen`, `period`, `meta`, `href`, `size`, `tone` |
| `MetricValue` / `MetricLabel` | Bare value / label for custom composition |
| `DeltaPill` | Percentage pill; `goodWhen: 'up' \| 'down'` decides tone, `null` renders `—` |
| `MetricInline` | Label-left / value-right row for narrow panels and detail pages |
| `MetricSkeleton` | Loading state that mirrors the typography, not a box |

Values arrive pre-formatted (`formatRupiah`, `formatNumber`, `formatPercent` from `@/lib/utils`) —
these components hold no domain logic.

---

## Badge — [src/components/ui/Badge/](../../../src/components/ui/Badge/)

| Prop | Type | Values |
|---|---|---|
| `variant` | CVA | `default` \| `secondary` \| `outline` \| `destructive` \| `success` \| `warning` |
| `size` | CVA | `sm` \| `md` \| `lg` |
| `dot` | boolean | prepends colored dot indicator |

---

## Card — [src/components/ui/Card/](../../../src/components/ui/Card/)

Sub-components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

| Prop | Type | Notes |
|---|---|---|
| `noPadding` | boolean | on `Card` — removes default `p-6` |

---

## Typography — [src/components/ui/Typography/](../../../src/components/ui/Typography/)

| Variant | HTML element | Class |
|---|---|---|
| `h1` | `<h1>` | `text-4xl font-extrabold tracking-tight lg:text-5xl` |
| `h2` | `<h2>` | `text-3xl font-semibold tracking-tight` |
| `h3`–`h6` | `<h3>`–`<h6>` | proportionally smaller |
| `p` | `<p>` | `leading-7` |
| `lead` | `<p>` | `text-xl leading-relaxed` |
| `large` | `<p>` | `text-lg` |
| `small` | `<p>` | `text-sm` |
| `muted` | `<p>` | `text-sm text-foreground-muted` |
| `code` | `<code>` | `bg-surface-raised px-1.5 font-mono text-sm` |

Prop `as?: ElementType` overrides the rendered element.

---

## Sonner — [src/components/ui/Sonner/](../../../src/components/ui/Sonner/)

| Export | Notes |
|---|---|
| `Toaster` | Pre-configured Sonner. Mount ONCE in `src/app/[locale]/layout.tsx` |

Config: `theme="dark"`, `richColors`, `position="bottom-right"`, classNames use design-system tokens with `!` Tailwind v4 important suffix.

---

← [01 — Layers, CVA](./01-structure-cva.md) | [COMPONENTS.md](../COMPONENTS.md) | → [03 — Storybook, tests, shadcn](./03-storybook-tests-shadcn.md)
