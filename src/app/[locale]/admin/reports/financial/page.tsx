import { MetricBlock, MetricRow } from '@/components/ui/Metric';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { canAccess } from '@/lib/auth';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { reportService } from '@/services/report.service';
import { roomService } from '@/services/room.service';

import { Forbidden } from '../../Forbidden';
import { ReportFilterBar } from '../ReportFilterBar';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; floorId?: string }>;
}

export default async function FinancialReportPage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'KEUANGAN']))) return <Forbidden />;
  const { from, to, floorId } = await searchParams;

  const [report, floors] = await Promise.all([
    reportService.financial({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      floorId: floorId || undefined,
    }),
    roomService.listFloors(),
  ]);

  const margin = report.totalRevenue > 0 ? (report.profit / report.totalRevenue) * 100 : null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Typography variant="h2" className="mb-1">
          Laporan Keuangan
        </Typography>
        <Typography variant="muted">
          Pendapatan, biaya maintenance &amp; pengeluaran operasional, dan profit per kamar.
        </Typography>
      </div>

      <ReportFilterBar floors={floors} from={from} to={to} floorId={floorId} />

      <MetricRow columns={3}>
        <MetricBlock
          label="Total Pendapatan"
          value={formatNumber(report.totalRevenue)}
          prefix="Rp"
          size="hero"
        />
        <MetricBlock
          label="Total Biaya"
          value={formatNumber(report.totalCost)}
          prefix="Rp"
          tone={report.totalCost > 0 ? 'default' : 'muted'}
          meta={`Maintenance ${formatRupiah(report.maintenanceCost)} + Pengeluaran ${formatRupiah(report.expenseCost)}`}
        />
        <MetricBlock
          label="Profit"
          value={formatNumber(report.profit)}
          prefix="Rp"
          tone={report.profit < 0 ? 'destructive' : 'default'}
          meta={margin === null ? 'Belum ada pendapatan' : `Margin ${formatPercent(margin)}`}
        />
      </MetricRow>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Arus Kas Deposit</h3>
          <Typography variant="muted" className="text-sm">
            Uang titipan penyewa — dipisah dari pendapatan sewa karena harus dikembalikan saat check-out.
          </Typography>
        </div>
        <MetricRow columns={3} stacked>
          <MetricBlock label="Deposit Diterima" value={formatNumber(report.depositReceived)} prefix="Rp" size="secondary" />
          <MetricBlock
            label="Deposit Dikembalikan"
            value={formatNumber(report.depositReturned)}
            prefix="Rp"
            size="secondary"
            tone={report.depositReturned > 0 ? 'default' : 'muted'}
          />
          <MetricBlock
            label="Deposit Bersih Dipegang"
            value={formatNumber(report.netDeposit)}
            prefix="Rp"
            size="secondary"
            tone={report.netDeposit < 0 ? 'destructive' : 'default'}
            meta="Belum termasuk saldo deposit dari periode sebelum filter ini."
          />
        </MetricRow>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Breakdown per Kamar</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Kamar
                </th>
                <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Pendapatan
                </th>
                <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Biaya
                </th>
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody>
              {report.byRoom.map((row) => (
                <tr key={row.roomNumber} className="border-b border-border">
                  <td className="py-2.5 pr-4 font-medium text-foreground">{row.roomNumber}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatRupiah(row.revenue)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground-muted">
                    {formatRupiah(row.cost)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(row.revenue - row.cost)}</td>
                </tr>
              ))}
              {report.byRoom.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-foreground-muted">
                    Tidak ada data untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            {report.byRoom.length > 0 && (
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="py-2.5 pr-4">Total</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatRupiah(report.totalRevenue)}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatRupiah(report.totalCost)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(report.profit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pengeluaran per Kategori</h3>
          <Typography variant="muted" className="text-sm">
            Biaya operasional di luar maintenance — klik kategori untuk lihat detail catatannya.
          </Typography>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Kategori
                </th>
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Nominal
                </th>
              </tr>
            </thead>
            <tbody>
              {report.expenseByCategory.map((row) => (
                <tr key={row.category} className="border-b border-border">
                  <td className="py-2.5 pr-4 font-medium text-foreground">
                    <Link
                      href={`/admin/expenses?category=${row.category}`}
                      className="hover:text-primary hover:underline"
                    >
                      {row.label}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(row.total)}</td>
                </tr>
              ))}
              {report.expenseByCategory.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-foreground-muted">
                    Belum ada pengeluaran untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            {report.expenseByCategory.length > 0 && (
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="py-2.5 pr-4">Total</td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(report.expenseCost)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
