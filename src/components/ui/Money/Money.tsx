import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';
import { formatNumber, formatRupiahShort } from '@/lib/utils';

/**
 * One rendering of money for the whole admin.
 *
 * Two decisions live here so no page re-litigates them:
 * 1. `Rp` is a unit, not a number — always one step smaller, lighter, and muted,
 *    so a column of amounts scans as digits rather than as repeated "Rp".
 * 2. The digits carry the weight. At metric sizes that means `font-semibold`
 *    (per DATA_PRESENTATION §2 rule 13); at row/table sizes `font-bold`, because
 *    at 13px semibold is indistinguishable from the label next to it.
 */
const moneyVariants = cva('inline-flex items-baseline whitespace-nowrap tabular-nums', {
  variants: {
    size: {
      hero: 'gap-1.5 text-4xl font-semibold tracking-tight sm:text-5xl',
      primary: 'gap-1.5 text-3xl font-semibold tracking-tight',
      secondary: 'gap-1 text-2xl font-semibold tracking-tight',
      /** Table cells, list rows, detail pairs — the size money is read at most. */
      inline: 'gap-1 text-sm font-bold',
      /** Table totals and subtotals: one step up from the rows they close. */
      total: 'gap-1 text-base font-bold tracking-tight',
      /** Hints, captions, secondary comparisons. */
      meta: 'gap-0.5 text-xs font-semibold',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-foreground-muted',
      primary: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-success',
    },
  },
  defaultVariants: { size: 'inline', tone: 'default' },
});

/** The unit shrinks with the value but never tracks it — see decision 1 above. */
const unitSize: Record<NonNullable<MoneyVariants['size']>, string> = {
  hero: 'text-xl',
  primary: 'text-lg',
  secondary: 'text-base',
  inline: 'text-xs',
  total: 'text-xs',
  meta: 'text-[0.625rem]',
};

export type MoneyVariants = VariantProps<typeof moneyVariants>;

export interface MoneyProps extends MoneyVariants {
  /** Rupiah as a plain number. `Prisma.Decimal` is converted in the service. */
  value: number | null | undefined;
  /** `Rp 12,4 jt` — hero figures and chart labels only, never tables or exports. */
  short?: boolean;
  /** Renders `+` on positives. For cash flow and selisih, where direction is the point. */
  signed?: boolean;
  /** Zero is data, so it renders `Rp 0` muted — pass false to keep it at full weight. */
  muteZero?: boolean;
  className?: string;
}

export function Money({
  value,
  size = 'inline',
  tone,
  short = false,
  signed = false,
  muteZero = true,
  className,
}: MoneyProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return (
      <span
        className={cn(moneyVariants({ size, tone: 'muted' }), className)}
        aria-label="Tidak ada nilai"
      >
        —
      </span>
    );
  }

  const rounded = Math.round(value);
  const resolvedTone = tone ?? (rounded === 0 && muteZero ? 'muted' : 'default');
  const sign = rounded < 0 ? '-' : signed && rounded > 0 ? '+' : '';
  const magnitude = Math.abs(rounded);
  const digits = short
    ? formatRupiahShort(magnitude).replace(/^Rp\s*/, '')
    : formatNumber(magnitude);

  return (
    <span className={cn(moneyVariants({ size, tone: resolvedTone }), className)}>
      <span className={cn('font-normal text-foreground-muted', unitSize[size ?? 'inline'])}>
        {sign}Rp
      </span>
      {digits}
    </span>
  );
}
Money.displayName = 'Money';
