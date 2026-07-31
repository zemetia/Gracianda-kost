# Design System

← [Blueprint INDEX](./INDEX.md)

| Part | Coverage |
|---|---|
| [01 — Core rules, surface, text, border, primary tokens](./DESIGN_SYSTEM/01-tokens-colors.md) | Core rules, Tailwind v4 `@theme` mechanics, surface/text/border/primary/semantic/card tokens |
| [02 — shadcn aliases, typography, radius, utilities](./DESIGN_SYSTEM/02-typography-utilities.md) | shadcn alias tokens, fonts, Typography component, radius, custom utilities, focus ring, adding tokens |

Numbers, metrics, and analytics surfaces have their own binding spec: [DATA_PRESENTATION.md](./DATA_PRESENTATION.md) — read it before styling any metric, KPI, report figure, table number, or chart.

> **Warning:** part 01 still documents the template's dark / electric-blue palette. This project's actual palette is light, warm off-white with a forest-green primary — `src/app/globals.css` is the source of truth, and [DATA_PRESENTATION.md §0](./DATA_PRESENTATION.md#0-token-caveats-read-first) lists the practical consequences.
