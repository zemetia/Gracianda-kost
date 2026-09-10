import { TrendBarChart } from '@/components/ui/TrendBarChart';
import { formatNumber, monthShortId } from '@/lib/utils';

interface Point {
  month: number;
  year: number;
  totalPeople: number;
}

export function HeadcountChart({ data }: { data: Point[] }) {
  return (
    <TrendBarChart
      ariaLabel="Grafik jumlah penyewa 6 bulan terakhir"
      data={data.map((point) => ({
        key: `${point.year}-${point.month}`,
        label: monthShortId(point.month),
        value: point.totalPeople,
        tooltip: `${monthShortId(point.month)} ${point.year}: ${formatNumber(point.totalPeople)} orang`,
      }))}
    />
  );
}
