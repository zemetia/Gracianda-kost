import { monthShortId } from '@/lib/utils';

interface Point {
  month: number;
  year: number;
  maintenanceCount: number;
  incidentCount: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 24;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 32;
const GROUP_GAP = 16;
const BAR_GAP = 4;

/**
 * Two-series column chart (maintenance vs insiden) in the same hand-rolled
 * house style as TrendBarChart — see DATA_PRESENTATION.md §10. Kept local to
 * the dashboard rather than promoted to ui/ since no other feature needs a
 * two-series variant yet.
 */
export function MaintenanceIncidentChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-foreground-muted">—</p>;
  }

  const max = Math.max(...data.flatMap((p) => [p.maintenanceCount, p.incidentCount]), 1);
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const groupWidth = (plotWidth - GROUP_GAP * (data.length - 1)) / data.length;
  const barWidth = (groupWidth - BAR_GAP) / 2;
  const baselineY = PADDING_TOP + plotHeight;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Grafik maintenance dan insiden 6 bulan terakhir"
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
      {data.map((point, i) => {
        const groupX = PADDING_X + i * (groupWidth + GROUP_GAP);
        const maintHeight = (point.maintenanceCount / max) * plotHeight;
        const incHeight = (point.incidentCount / max) * plotHeight;
        const label = monthShortId(point.month);

        return (
          <g key={`${point.year}-${point.month}`}>
            <title>
              {label} {point.year}: {point.maintenanceCount} maintenance, {point.incidentCount} insiden
            </title>
            <rect
              x={groupX}
              y={baselineY - maintHeight}
              width={barWidth}
              height={Math.max(maintHeight, 2)}
              rx={3}
              className="fill-primary"
            />
            <rect
              x={groupX + barWidth + BAR_GAP}
              y={baselineY - incHeight}
              width={barWidth}
              height={Math.max(incHeight, 2)}
              rx={3}
              className="fill-destructive"
            />
            <text
              x={groupX + groupWidth / 2}
              y={baselineY + 18}
              textAnchor="middle"
              className="fill-foreground-muted text-[10px]"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
MaintenanceIncidentChart.displayName = 'MaintenanceIncidentChart';
