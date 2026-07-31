import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/utils';

/* ── Row ──────────────────────────────────────────────────────── */

const metricRowVariants = cva('grid grid-cols-1 gap-8 sm:grid-cols-2', {
  variants: {
    columns: {
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
    },
    divided: {
      true: 'lg:gap-0 lg:divide-x lg:divide-border lg:[&>*:not(:first-child)]:pl-8',
      false: '',
    },
    bordered: {
      true: 'border-y border-border py-8',
      false: '',
    },
  },
  defaultVariants: { columns: 3, divided: true, bordered: true },
});

export type MetricRowVariants = VariantProps<typeof metricRowVariants>;

export interface MetricRowProps
  extends Omit<HTMLAttributes<HTMLElement>, 'color'>,
    MetricRowVariants {
  /** Collapses this row's top hairline into the previous row's bottom one. */
  stacked?: boolean;
}

export function MetricRow({
  columns,
  divided,
  bordered,
  stacked = false,
  className,
  children,
  ...props
}: MetricRowProps) {
  return (
    <section
      className={cn(
        metricRowVariants({ columns, divided, bordered }),
        stacked && '-mt-px',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
MetricRow.displayName = 'MetricRow';

/* ── Label ────────────────────────────────────────────────────── */

export type MetricLabelProps = HTMLAttributes<HTMLParagraphElement>;

export function MetricLabel({ className, children, ...props }: MetricLabelProps) {
  return (
    <p
      className={cn(
        'text-xs font-medium uppercase tracking-wide text-foreground-muted',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
MetricLabel.displayName = 'MetricLabel';

/* ── Value ────────────────────────────────────────────────────── */

const metricValueVariants = cva('font-semibold tracking-tight tabular-nums', {
  variants: {
    size: {
      hero: 'text-4xl sm:text-5xl',
      primary: 'text-3xl',
      secondary: 'text-2xl font-medium',
      inline: 'text-sm font-medium tracking-normal',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-foreground-muted',
      primary: 'text-primary',
      destructive: 'text-destructive',
    },
  },
  defaultVariants: { size: 'primary', tone: 'default' },
});

export type MetricValueVariants = VariantProps<typeof metricValueVariants>;

export interface MetricValueProps
  extends Omit<HTMLAttributes<HTMLParagraphElement>, 'prefix'>,
    MetricValueVariants {
  /** Unit shown before the number — smaller and muted, never the same size. */
  prefix?: ReactNode;
  /** Unit shown after the number. */
  suffix?: ReactNode;
}

const affixSize: Record<NonNullable<MetricValueVariants['size']>, string> = {
  hero: 'text-xl',
  primary: 'text-lg',
  secondary: 'text-base',
  inline: 'text-xs',
};

export function MetricValue({
  size = 'primary',
  tone,
  prefix,
  suffix,
  className,
  children,
  ...props
}: MetricValueProps) {
  const affix = cn('font-normal text-foreground-muted', affixSize[size ?? 'primary']);

  return (
    <p className={cn(metricValueVariants({ size, tone }), className)} {...props}>
      {prefix && <span className={cn('mr-1', affix)}>{prefix}</span>}
      {children}
      {suffix && <span className={cn('ml-1', affix)}>{suffix}</span>}
    </p>
  );
}
MetricValue.displayName = 'MetricValue';

/* ── Delta pill ───────────────────────────────────────────────── */

export interface DeltaPillProps {
  /** Percentage change. `null` means no baseline — renders an em dash. */
  value: number | null;
  /** Which direction counts as an improvement. Tunggakan and biaya are `'down'`. */
  goodWhen?: 'up' | 'down';
  className?: string;
}

/** Below this, a change is noise — render it flat rather than tinted. */
const NOISE_FLOOR = 0.05;

export function DeltaPill({ value, goodWhen = 'up', className }: DeltaPillProps) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className={cn('text-xs text-foreground-muted', className)} aria-label="Tanpa pembanding">
        —
      </span>
    );
  }

  const flat = Math.abs(value) < NOISE_FLOOR;
  const good = goodWhen === 'up' ? value > 0 : value < 0;
  const Icon = value < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
        flat
          ? 'bg-surface-raised text-foreground-muted'
          : good
            ? 'bg-success-subtle text-success'
            : 'bg-destructive-subtle text-destructive',
        className,
      )}
    >
      {!flat && <Icon className="size-3" aria-hidden />}
      {formatPercent(Math.abs(value))}
    </span>
  );
}
DeltaPill.displayName = 'DeltaPill';

/* ── Block ────────────────────────────────────────────────────── */

export interface MetricBlockProps {
  label: string;
  /** Pre-formatted value. Empty metrics pass `'—'`, never a collapsed block. */
  value: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  delta?: number | null;
  goodWhen?: 'up' | 'down';
  /** Comparison period, rendered inline next to the delta pill. */
  period?: string;
  /** Trailing muted line — source note, timestamp, secondary comparison. */
  meta?: ReactNode;
  /** Turns the whole block into the pre-filtered list that answers the number. */
  href?: string;
  size?: MetricValueVariants['size'];
  tone?: MetricValueVariants['tone'];
  className?: string;
}

export function MetricBlock({
  label,
  value,
  prefix,
  suffix,
  delta,
  goodWhen = 'up',
  period,
  meta,
  href,
  size = 'primary',
  tone,
  className,
}: MetricBlockProps) {
  const body = (
    <>
      <MetricLabel className={href ? 'transition-colors group-hover:text-foreground' : undefined}>
        {label}
      </MetricLabel>
      <MetricValue
        size={size}
        tone={tone}
        prefix={prefix}
        suffix={suffix}
        className={cn(
          'mt-2',
          href &&
            'underline decoration-transparent underline-offset-4 transition group-hover:decoration-border-strong',
        )}
      >
        {value}
      </MetricValue>
      {(delta !== undefined || period) && (
        <div className="mt-2 flex items-baseline gap-2">
          {delta !== undefined && <DeltaPill value={delta ?? null} goodWhen={goodWhen} />}
          {period && <span className="text-xs text-foreground-muted">{period}</span>}
        </div>
      )}
      {meta && <p className="mt-1 text-xs text-foreground-muted">{meta}</p>}
    </>
  );

  if (!href) return <div className={className}>{body}</div>;

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {body}
    </Link>
  );
}
MetricBlock.displayName = 'MetricBlock';

/* ── Inline ───────────────────────────────────────────────────── */

export interface MetricInlineProps {
  label: string;
  value: ReactNode;
  /** Optional status or delta element rendered next to the value. */
  trailing?: ReactNode;
  href?: string;
  className?: string;
}

/** Compact label-left / value-right row for narrow panels and detail pages. */
export function MetricInline({ label, value, trailing, href, className }: MetricInlineProps) {
  const body = (
    <>
      <span className="text-sm text-foreground-muted transition-colors group-hover:text-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
        {trailing}
      </span>
    </>
  );

  const classes = cn(
    'group flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0',
    className,
  );

  if (!href) return <div className={classes}>{body}</div>;

  return (
    <Link
      href={href}
      className={cn(classes, 'rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
    >
      {body}
    </Link>
  );
}
MetricInline.displayName = 'MetricInline';

/* ── Skeleton ─────────────────────────────────────────────────── */

export function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="h-3 w-24 animate-pulse rounded bg-surface-raised" />
      <div className="mt-3 h-8 w-40 animate-pulse rounded bg-surface-raised" />
    </div>
  );
}
MetricSkeleton.displayName = 'MetricSkeleton';
