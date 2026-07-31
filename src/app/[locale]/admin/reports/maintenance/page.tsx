import { MetricBlock, MetricRow } from '@/components/ui/Metric';
import { Select } from '@/components/ui/Select';
import { Typography } from '@/components/ui/Typography';
import { canAccess } from '@/lib/auth';
import { formatNumber, formatRupiah } from '@/lib/utils';
import { reportService } from '@/services/report.service';
import { roomService } from '@/services/room.service';
import type { MaintenanceScope } from '@/generated/prisma/client';

import { Forbidden } from '../../Forbidden';
import { ReportFilterBar } from '../ReportFilterBar';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; floorId?: string; scope?: string }>;
}

export default async function MaintenanceReportPage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'OPERASIONAL']))) return <Forbidden />;
  const { from, to, floorId, scope } = await searchParams;
  const scopeValue = scope === 'ROOM' || scope === 'BUILDING' ? (scope as MaintenanceScope) : undefined;

  const [report, floors] = await Promise.all([
    reportService.maintenance({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      floorId: floorId || undefined,
      scope: scopeValue,
    }),
    roomService.listFloors(),
  ]);

  const averageCost = report.count > 0 ? report.totalCost / report.count : null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Typography variant="h2" className="mb-1">
          Laporan Maintenance
        </Typography>
        <Typography variant="muted">Jumlah &amp; total biaya perawatan per kamar/lantai/gedung.</Typography>
      </div>

      <ReportFilterBar
        floors={floors}
        from={from}
        to={to}
        floorId={floorId}
        extra={
          <Select
            name="scope"
            label="Scope"
            size="sm"
            placeholder="Semua"
            allowEmpty
            defaultValue={scope ?? ''}
            options={[
              { value: 'ROOM', label: 'Per Kamar' },
              { value: 'BUILDING', label: 'Gedung' },
            ]}
          />
        }
      />

      <MetricRow columns={2}>
        <MetricBlock
          label="Total Biaya"
          value={formatNumber(report.totalCost)}
          prefix="Rp"
          size="hero"
          meta={averageCost === null ? 'Belum ada catatan' : `Rata-rata ${formatRupiah(averageCost)} per catatan`}
        />
        <MetricBlock
          label="Jumlah Catatan"
          value={formatNumber(report.count)}
          tone={report.count > 0 ? 'default' : 'muted'}
        />
      </MetricRow>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-foreground">Breakdown per Kamar/Gedung</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Lokasi
                </th>
                <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Jumlah
                </th>
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Total Biaya
                </th>
              </tr>
            </thead>
            <tbody>
              {report.byRoom.map((row) => (
                <tr key={row.roomNumber} className="border-b border-border">
                  <td className="py-2.5 pr-4 font-medium text-foreground">{row.roomNumber}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-foreground-muted">
                    {formatNumber(row.count)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(row.totalCost)}</td>
                </tr>
              ))}
              {report.byRoom.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-foreground-muted">
                    Tidak ada data untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
            {report.byRoom.length > 0 && (
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="py-2.5 pr-4">Total</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{formatNumber(report.count)}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatRupiah(report.totalCost)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
