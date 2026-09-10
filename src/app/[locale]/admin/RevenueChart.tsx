import { TrendBarChart } from '@/components/ui/TrendBarChart';
import { formatRupiah, monthShortId } from '@/lib/utils';

interface Point {
  month: number;
  year: number;
  total: number;
}

export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <TrendBarChart
      ariaLabel="Grafik pendapatan 6 bulan terakhir"
      data={data.map((point) => ({
        key: `${point.year}-${point.month}`,
        label: monthShortId(point.month),
        value: point.total,
        tooltip: `${monthShortId(point.month)} ${point.year}: ${formatRupiah(point.total)}`,
      }))}
    />
  );
}
