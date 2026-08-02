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
import {
  INCIDENT_CATEGORY_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_STATUS_VARIANT,
  incidentCategoryLabel,
  incidentPersonRoleLabel,
  incidentPlaceLabel,
  incidentStatusLabel,
} from '@/lib/incident';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate } from '@/lib/utils';
import { incidentService } from '@/services/incident.service';
import { roomService } from '@/services/room.service';
import { tenantService } from '@/services/tenant.service';
import type { IncidentCategory, IncidentStatus } from '@/generated/prisma/client';

interface Props {
  searchParams: Promise<{
    category?: string;
    status?: string;
    floorId?: string;
    roomId?: string;
    tenantId?: string;
    propertyId?: string;
  }>;
}

export default async function IncidentsPage({ searchParams }: Props) {
  const { category, status, floorId, roomId, tenantId, propertyId } = await searchParams;
  const scopedPropertyId = await getPropertyScope(propertyId);
  const [incidents, floors, rooms, session, focusedTenant] = await Promise.all([
    incidentService.list({
      category: category as IncidentCategory | undefined,
      status: status as IncidentStatus | undefined,
      propertyId: scopedPropertyId,
      floorId: floorId || undefined,
      roomId: roomId || undefined,
      tenantId: tenantId || undefined,
    }),
    roomService.listFloors(scopedPropertyId),
    roomService.list(scopedPropertyId, 'all'),
    getSession(),
    tenantId ? tenantService.getById(tenantId) : null,
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

      {focusedTenant && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-3">
          <Typography variant="muted">
            Menampilkan insiden yang mencatat{' '}
            <span className="font-medium text-foreground">{focusedTenant.fullName}</span>.
          </Typography>
          <Link href="/admin/incidents" className="text-sm font-medium text-primary hover:underline">
            Tampilkan semua
          </Link>
        </div>
      )}

      <Card noPadding>
        <CardContent className="p-4">
          <form method="get" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {tenantId && <input type="hidden" name="tenantId" value={tenantId} />}
            <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-3xl lg:grid-cols-4">
              <Select
                name="category"
                label="Kategori"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={category ?? ''}
                options={INCIDENT_CATEGORY_OPTIONS}
              />
              <Select
                name="status"
                label="Status"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={status ?? ''}
                options={INCIDENT_STATUS_OPTIONS}
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
              <Select
                name="roomId"
                label="Kamar"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={roomId ?? ''}
                options={rooms.map((room) => ({
                  value: room.id,
                  label: `No. ${room.number}`,
                  ...(room.floor ? { hint: room.floor.name } : {}),
                }))}
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
            <TableHead>Orang</TableHead>
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
                  {incidentCategoryLabel(incident.category)}
                </Link>
              </TableCell>
              <TableCell className="text-foreground-muted">
                {incident.property.name} · {incidentPlaceLabel(incident)}
              </TableCell>
              <TableCell className="text-foreground-muted">
                {incident.people.length === 0
                  ? '—'
                  : incident.people
                      .map((person) => `${person.name} (${incidentPersonRoleLabel(person.role)})`)
                      .join(', ')}
              </TableCell>
              <TableCell>
                <Badge variant={INCIDENT_STATUS_VARIANT[incident.status]}>
                  {incidentStatusLabel(incident.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {incidents.length === 0 && <TableEmpty colSpan={5}>Belum ada insiden tercatat.</TableEmpty>}
        </TableBody>
      </Table>
    </div>
  );
}
