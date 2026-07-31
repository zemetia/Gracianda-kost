import { MetricBlock, MetricRow } from '@/components/ui/Metric';
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Metode
                </th>
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Tipe
                </th>
                <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Jumlah Transaksi
                </th>
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {report.byMethod.map((row) => (
                <tr key={row.methodId ?? 'UNKNOWN'} className="border-b border-border">
                  <td className="py-2.5 pr-4 font-medium text-foreground">{row.name}</td>
                  <td className="py-2.5 pr-4 text-foreground-muted">
                    {row.type ? TYPE_LABEL[row.type] : '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatNumber(row.count)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(row.total)}</td>
                </tr>
              ))}
              {report.byMethod.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-foreground-muted">
                    Tidak ada data untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            {report.byMethod.length > 0 && (
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="py-2.5 pr-4" colSpan={3}>
                    Total
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(report.totalReceived)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
