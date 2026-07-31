import { formatRupiah } from '@/lib/utils';

interface Point {
  month: number;
  year: number;
  total: number;
}

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 24;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 32;
const BAR_GAP = 16;

export function RevenueChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const barWidth = (plotWidth - BAR_GAP * (data.length - 1)) / data.length;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Grafik pendapatan 6 bulan terakhir"
      className="w-full"
    >
      <line
        x1={PADDING_X}
        y1={PADDING_TOP + plotHeight}
        x2={WIDTH - PADDING_X}
        y2={PADDING_TOP + plotHeight}
        className="stroke-border"
        strokeWidth={1}
      />
      {data.map((point, i) => {
        const barHeight = max > 0 ? (point.total / max) * plotHeight : 0;
        const x = PADDING_X + i * (barWidth + BAR_GAP);
        const y = PADDING_TOP + plotHeight - barHeight;
        return (
          <g key={`${point.year}-${point.month}`}>
            <title>
              {MONTH_SHORT_ID[point.month - 1]} {point.year}: {formatRupiah(point.total)}
            </title>
            <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 2)} rx={4} className="fill-primary" />
            <text
              x={x + barWidth / 2}
              y={PADDING_TOP + plotHeight + 18}
              textAnchor="middle"
              className="fill-foreground-muted text-[10px]"
            >
              {MONTH_SHORT_ID[point.month - 1]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
