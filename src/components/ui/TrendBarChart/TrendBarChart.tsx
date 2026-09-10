import { cn } from '@/lib/cn';

export interface TrendBarChartPoint {
  /** Stable identity for the bar; falls back to its index when omitted. */
  key?: string | number;
  /** X-axis tick — pre-formatted by the caller (no i18n/domain logic in ui/). */
  label: string;
  /** Raw value driving bar height. */
  value: number;
  /** Pre-formatted tooltip text; falls back to `${label}: ${value}`. */
  tooltip?: string;
}

export interface TrendBarChartProps {
  data: TrendBarChartPoint[];
  /** Accessible name for the chart — there is no visible chart title. */
  ariaLabel: string;
  height?: number;
  className?: string;
}

const WIDTH = 640;
const PADDING_X = 24;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 32;
const BAR_GAP = 16;

/**
 * Single-series column chart, house style: `fill-primary`, no border/fill/box,
 * a hairline baseline, and a native `<title>` per bar as both tooltip and
 * accessible label — see DATA_PRESENTATION.md §10.
 */
export function TrendBarChart({ data, ariaLabel, height = 220, className }: TrendBarChartProps) {
  if (data.length === 0) {
    return <p className={cn('text-xs text-foreground-muted', className)}>—</p>;
  }

  const max = Math.max(...data.map((point) => point.value), 1);
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const barWidth = (plotWidth - BAR_GAP * (data.length - 1)) / data.length;
  const baselineY = PADDING_TOP + plotHeight;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label={ariaLabel}
      className={cn('w-full', className)}
    >
      <line
        x1={PADDING_X}
        y1={baselineY}
        x2={WIDTH - PADDING_X}
        y2={baselineY}
        className="stroke-border"
        strokeWidth={1}
      />
      {data.map((point, i) => {
        const barHeight = max > 0 ? (point.value / max) * plotHeight : 0;
        const x = PADDING_X + i * (barWidth + BAR_GAP);
        const y = baselineY - barHeight;
        return (
          <g key={point.key ?? i}>
            <title>{point.tooltip ?? `${point.label}: ${point.value}`}</title>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={4}
              className="fill-primary"
            />
            <text
              x={x + barWidth / 2}
              y={baselineY + 18}
              textAnchor="middle"
              className="fill-foreground-muted text-[10px]"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
TrendBarChart.displayName = 'TrendBarChart';
