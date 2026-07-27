import { Badge } from '@/components/ui/Badge';
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

const CATEGORY_LABEL: Record<string, string> = {
  PELANGGARAN_ATURAN: 'Pelanggaran Aturan',
  GANGGUAN: 'Gangguan',
  KERUSAKAN: 'Kerusakan',
  KEHILANGAN: 'Kehilangan',
  KELUHAN_PENGHUNI: 'Keluhan Penghuni',
  LAPORAN_SECURITY: 'Laporan Security',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Selesai',
};

export default async function IncidentsReportPage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'SECURITY']))) return <Forbidden />;
  const { from, to, floorId } = await searchParams;

  const [report, floors] = await Promise.all([
    reportService.incidents({
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
          Laporan Insiden
        </Typography>
        <Typography variant="muted">Breakdown insiden per status dan kategori.</Typography>
      </div>

      <ReportFilterBar floors={floors} from={from} to={to} floorId={floorId} />

      <Card>
        <CardContent>
          <Typography variant="muted">Total Insiden</Typography>
          <Typography variant="h3">{report.total}</Typography>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(report.byStatus).map(([status, count]) => (
            <Badge key={status} variant="outline">
              {STATUS_LABEL[status]}: {count}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per Kategori</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(report.byCategory).map(([category, count]) => (
            <Badge key={category} variant="outline">
              {CATEGORY_LABEL[category]}: {count}
            </Badge>
          ))}
          {Object.keys(report.byCategory).length === 0 && (
            <Typography variant="muted">Tidak ada data untuk periode ini.</Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
