interface Quarter {
  quarter: number;
  label: string;
  revenueMio: number;
  costMio: number;
}

const WIDTH = 400;
const HEIGHT = 160;
const PADDING_X = 16;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;
const GROUP_GAP = 20;
const BAR_GAP = 4;

/**
 * Revenue vs cost per quarter, in Mio IDR — same hand-rolled two-series house
 * style as MaintenanceIncidentChart, tokens matching QuarterlyFinancialCard's
 * legend (success = revenue, warning = cost).
 */
export function QuarterRevenueCostChart({ data }: { data: Quarter[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-foreground-muted">—</p>;
  }

  const max = Math.max(...data.flatMap((q) => [q.revenueMio, q.costMio]), 1);
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const groupWidth = (plotWidth - GROUP_GAP * (data.length - 1)) / data.length;
  const barWidth = (groupWidth - BAR_GAP) / 2;
  const baselineY = PADDING_TOP + plotHeight;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Grafik pendapatan dan biaya per kuartal, dalam jutaan rupiah"
      className="w-full"
    >
      <line
        x1={PADDING_X}
        y1={baselineY}
        x2={WIDTH - PADDING_X}
        y2={baselineY}
        className="stroke-border"
        strokeWidth={1}
      />
      {data.map((q, i) => {
        const groupX = PADDING_X + i * (groupWidth + GROUP_GAP);
        const revHeight = (q.revenueMio / max) * plotHeight;
        const costHeight = (q.costMio / max) * plotHeight;

        return (
          <g key={q.quarter}>
            <title>
              {q.label}: Revenue {q.revenueMio.toFixed(1)} Mio, Cost {q.costMio.toFixed(1)} Mio
            </title>
            <rect
              x={groupX}
              y={baselineY - revHeight}
              width={barWidth}
              height={Math.max(revHeight, 2)}
              rx={3}
              className="fill-success"
            />
            <rect
              x={groupX + barWidth + BAR_GAP}
              y={baselineY - costHeight}
              width={barWidth}
              height={Math.max(costHeight, 2)}
              rx={3}
              className="fill-warning"
            />
            <text
              x={groupX + groupWidth / 2}
              y={baselineY + 18}
              textAnchor="middle"
              className="fill-foreground-muted text-[10px]"
            >
              {q.label.split(' ')[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
QuarterRevenueCostChart.displayName = 'QuarterRevenueCostChart';
