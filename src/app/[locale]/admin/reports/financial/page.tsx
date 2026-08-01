import { MetricBlock, MetricRow } from '@/components/ui/Metric';
import { Money } from '@/components/ui/Money';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kamar</TableHead>
              <TableHead className="text-right">Pendapatan</TableHead>
              <TableHead className="text-right">Biaya</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.byRoom.map((row) => (
              <TableRow key={row.roomNumber}>
                <TableCell className="font-medium text-foreground">{row.roomNumber}</TableCell>
                <TableCell className="text-right">
                  <Money value={row.revenue} />
                </TableCell>
                <TableCell className="text-right">
                  <Money value={row.cost} tone="muted" />
                </TableCell>
                <TableCell className="text-right">
                  <Money
                    value={row.revenue - row.cost}
                    tone={row.revenue - row.cost < 0 ? 'destructive' : undefined}
                  />
                </TableCell>
              </TableRow>
            ))}
            {report.byRoom.length === 0 && (
              <TableEmpty colSpan={4}>Tidak ada data untuk periode ini.</TableEmpty>
            )}
          </TableBody>
          {report.byRoom.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  <Money value={report.totalRevenue} size="total" />
                </TableCell>
                <TableCell className="text-right">
                  <Money value={report.totalCost} size="total" />
                </TableCell>
                <TableCell className="text-right">
                  <Money
                    value={report.profit}
                    size="total"
                    tone={report.profit < 0 ? 'destructive' : 'primary'}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pengeluaran per Kategori</h3>
          <Typography variant="muted" className="text-sm">
            Biaya operasional di luar maintenance — klik kategori untuk lihat detail catatannya.
          </Typography>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.expenseByCategory.map((row) => (
              <TableRow key={row.category}>
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={`/admin/expenses?category=${row.category}`}
                    className="hover:text-primary hover:underline"
                  >
                    {row.label}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <Money value={row.total} />
                </TableCell>
              </TableRow>
            ))}
            {report.expenseByCategory.length === 0 && (
              <TableEmpty colSpan={2}>Belum ada pengeluaran untuk periode ini.</TableEmpty>
            )}
          </TableBody>
          {report.expenseByCategory.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  <Money value={report.expenseCost} size="total" />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </section>
    </div>
  );
}
