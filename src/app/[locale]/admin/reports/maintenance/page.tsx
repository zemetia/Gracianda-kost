import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { canAccess } from '@/lib/auth';
import { reportService } from '@/services/report.service';
import { roomService } from '@/services/room.service';
import type { MaintenanceScope } from '@prisma/client';

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

  return (
    <div className="flex flex-col gap-6">
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="scope" className="text-sm font-medium text-foreground">
              Scope
            </label>
            <select
              id="scope"
              name="scope"
              defaultValue={scope ?? ''}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Semua</option>
              <option value="ROOM">Per Kamar</option>
              <option value="BUILDING">Gedung</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <Typography variant="muted">Jumlah Catatan</Typography>
            <Typography variant="h3">{report.count}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="muted">Total Biaya</Typography>
            <Typography variant="h3">Rp {report.totalCost.toLocaleString('id-ID')}</Typography>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown per Kamar/Gedung</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Jumlah</th>
                <th className="px-4 py-3 font-medium">Total Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.byRoom.map((row) => (
                <tr key={row.roomNumber}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.roomNumber}</td>
                  <td className="px-4 py-3 text-foreground-muted">{row.count}</td>
                  <td className="px-4 py-3 text-foreground-muted">Rp {row.totalCost.toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {report.byRoom.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-foreground-subtle">
                    Tidak ada data untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
