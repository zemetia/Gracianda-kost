import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { incidentService } from '@/services/incident.service';
import { roomService } from '@/services/room.service';
import type { IncidentCategory, IncidentStatus } from '@prisma/client';

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

      <Card>
        <CardContent>
          <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category" className="text-sm font-medium text-foreground">
                Kategori
              </label>
              <select
                id="category"
                name="category"
                defaultValue={category ?? ''}
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Semua</option>
                {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status ?? ''}
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Semua</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="floorId" className="text-sm font-medium text-foreground">
                Lantai
              </label>
              <select
                id="floorId"
                name="floorId"
                defaultValue={floorId ?? ''}
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Semua</option>
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" className="self-end">
              Terapkan Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Lokasi</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {incidents.map((incident) => (
              <tr key={incident.id}>
                <td className="px-4 py-3 text-foreground-muted">{incident.date.toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link href={`/admin/incidents/${incident.id}`} className="hover:underline">
                    {CATEGORY_LABEL[incident.category]}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {incident.property.name} · {incident.room ? `Unit ${incident.room.number} ${incident.room.floor ? `(${incident.room.floor.name})` : ''}` : incident.location ?? 'Seluruh Properti'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[incident.status]}>{STATUS_LABEL[incident.status]}</Badge>
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-foreground-subtle">
                  Belum ada insiden tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
