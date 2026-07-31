import { MetricBlock, MetricRow } from '@/components/ui/Metric';
import { Select } from '@/components/ui/Select';
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lokasi</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Total Biaya</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.byRoom.map((row) => (
              <TableRow key={row.roomNumber}>
                <TableCell className="font-medium text-foreground">{row.roomNumber}</TableCell>
                <TableCell className="text-right tabular-nums text-foreground-muted">
                  {formatNumber(row.count)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(row.totalCost)}</TableCell>
              </TableRow>
            ))}
            {report.byRoom.length === 0 && (
              <TableEmpty colSpan={3}>Tidak ada data untuk periode ini.</TableEmpty>
            )}
          </TableBody>
          {report.byRoom.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(report.count)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(report.totalCost)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </section>
    </div>
  );
}
