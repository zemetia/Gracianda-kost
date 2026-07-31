import { MetricBlock, MetricRow } from '@/components/ui/Metric';
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
import { canAccess } from '@/lib/auth';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { reportService } from '@/services/report.service';
import { roomService } from '@/services/room.service';

import { Forbidden } from '../../Forbidden';
import { ReportFilterBar } from '../ReportFilterBar';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; floorId?: string }>;
}

const TYPE_LABEL: Record<string, string> = {
  CASH: 'Tunai',
  BANK: 'Rekening Bank',
  EWALLET: 'E-Wallet',
};

export default async function CashReportPage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'KEUANGAN']))) return <Forbidden />;
  const { from, to, floorId } = await searchParams;

  const [report, floors] = await Promise.all([
    reportService.cash({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      floorId: floorId || undefined,
    }),
    roomService.listFloors(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Typography variant="h2" className="mb-1">
          Rekap Kas
        </Typography>
        <Typography variant="muted">
          Uang masuk per metode pembayaran — cocokkan dengan kas fisik dan setiap rekening bank.
        </Typography>
      </div>

      <ReportFilterBar floors={floors} from={from} to={to} floorId={floorId} />

      <MetricRow>
        <MetricBlock label="Total Kas Masuk" value={formatNumber(report.totalReceived)} prefix="Rp" size="hero" />
      </MetricRow>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Breakdown per Metode</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metode</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Jumlah Transaksi</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.byMethod.map((row) => (
              <TableRow key={row.methodId ?? 'UNKNOWN'}>
                <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                <TableCell className="text-foreground-muted">
                  {row.type ? TYPE_LABEL[row.type] : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.count)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(row.total)}</TableCell>
              </TableRow>
            ))}
            {report.byMethod.length === 0 && (
              <TableEmpty colSpan={4}>Tidak ada data untuk periode ini.</TableEmpty>
            )}
          </TableBody>
          {report.byMethod.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(report.totalReceived)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </section>
    </div>
  );
}
