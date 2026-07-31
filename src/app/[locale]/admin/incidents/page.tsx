import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate } from '@/lib/utils';
import { incidentService } from '@/services/incident.service';
import { roomService } from '@/services/room.service';
import type { IncidentCategory, IncidentStatus } from '@/generated/prisma/client';

interface Props {
  searchParams: Promise<{
    category?: string;
    status?: string;
    floorId?: string;
    propertyId?: string;
  }>;
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

const STATUS_VARIANT: Record<string, 'destructive' | 'warning' | 'success'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

export default async function IncidentsPage({ searchParams }: Props) {
  const { category, status, floorId, propertyId } = await searchParams;
  const scopedPropertyId = await getPropertyScope(propertyId);
  const [incidents, floors, session] = await Promise.all([
    incidentService.list({
      category: category as IncidentCategory | undefined,
      status: status as IncidentStatus | undefined,
      propertyId: scopedPropertyId,
      floorId: floorId || undefined,
    }),
    roomService.listFloors(scopedPropertyId),
    getSession(),
  ]);
  const canCreate = session && ['SUPER_ADMIN', 'SECURITY', 'OPERASIONAL'].includes(session.user.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Insiden
          </Typography>
          <Typography variant="muted">Laporan gangguan, kerusakan, dan pelanggaran.</Typography>
        </div>
        {canCreate && (
          <Link href="/admin/incidents/new">
            <Button>Lapor Insiden</Button>
          </Link>
        )}
      </div>

      <Card noPadding>
        <CardContent className="p-4">
          <form method="get" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-2xl lg:grid-cols-3">
              <Select
                name="category"
                label="Kategori"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={category ?? ''}
                options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
              />
              <Select
                name="status"
                label="Status"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={status ?? ''}
                options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
              />
              <Select
                name="floorId"
                label="Lantai"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={floorId ?? ''}
                options={floors.map((floor) => ({ value: floor.id, label: floor.name }))}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="shrink-0">
              Terapkan Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell className="tabular-nums text-foreground-muted">
                {formatDate(incident.date, 'id-ID')}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                <Link href={`/admin/incidents/${incident.id}`} className="hover:underline">
                  {CATEGORY_LABEL[incident.category]}
                </Link>
              </TableCell>
              <TableCell className="text-foreground-muted">
                {incident.property.name} · {incident.room ? `Unit ${incident.room.number} ${incident.room.floor ? `(${incident.room.floor.name})` : ''}` : incident.location ?? 'Seluruh Properti'}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[incident.status]}>{STATUS_LABEL[incident.status]}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {incidents.length === 0 && <TableEmpty colSpan={4}>Belum ada insiden tercatat.</TableEmpty>}
        </TableBody>
      </Table>
    </div>
  );
}
