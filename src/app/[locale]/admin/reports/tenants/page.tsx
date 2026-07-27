import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { canAccess } from '@/lib/auth';
import { reportService } from '@/services/report.service';
import { roomService } from '@/services/room.service';

import { Forbidden } from '../../Forbidden';
import { ReportFilterBar } from '../ReportFilterBar';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; floorId?: string }>;
}

export default async function TenantsReportPage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'OPERASIONAL']))) return <Forbidden />;
  const { from, to, floorId } = await searchParams;

  const [report, floors] = await Promise.all([
    reportService.tenants({
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
          Laporan Penyewa
        </Typography>
        <Typography variant="muted">Kontrak aktif, keluar, baru, terlambat bayar, dan blacklist.</Typography>
      </div>

      <ReportFilterBar floors={floors} from={from} to={to} floorId={floorId} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent>
            <Typography variant="muted">Kontrak Aktif</Typography>
            <Typography variant="h3">{report.active}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="muted">Keluar Periode Ini</Typography>
            <Typography variant="h3">{report.endedThisPeriod}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="muted">Baru Periode Ini</Typography>
            <Typography variant="h3">{report.newThisPeriod}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="muted">Terlambat Bayar</Typography>
            <Typography variant="h3">{report.overdueCount}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="muted">Blacklist</Typography>
            <Typography variant="h3">{report.blacklisted}</Typography>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
