import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { canAccess } from '@/lib/auth';
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Laporan Keuangan
        </Typography>
        <Typography variant="muted">Pendapatan, biaya maintenance, dan profit per kamar.</Typography>
      </div>

      <ReportFilterBar floors={floors} from={from} to={to} floorId={floorId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <Typography variant="muted">Total Pendapatan</Typography>
            <Typography variant="h3">Rp {report.totalRevenue.toLocaleString('id-ID')}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="muted">Total Biaya Maintenance</Typography>
            <Typography variant="h3">Rp {report.totalCost.toLocaleString('id-ID')}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="muted">Profit</Typography>
            <Typography variant="h3">Rp {report.profit.toLocaleString('id-ID')}</Typography>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown per Kamar</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-surface-raised text-left text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Kamar</th>
                <th className="px-4 py-3 font-medium">Pendapatan</th>
                <th className="px-4 py-3 font-medium">Biaya</th>
                <th className="px-4 py-3 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.byRoom.map((row) => (
                <tr key={row.roomNumber}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.roomNumber}</td>
                  <td className="px-4 py-3 text-foreground-muted">Rp {row.revenue.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-foreground-muted">Rp {row.cost.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-foreground-muted">
                    Rp {(row.revenue - row.cost).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              {report.byRoom.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-foreground-subtle">
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
