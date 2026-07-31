import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate, formatRupiah } from '@/lib/utils';
import { maintenanceService } from '@/services/maintenance.service';
import { roomService } from '@/services/room.service';

interface Props {
  searchParams: Promise<{
    scope?: string;
    floorId?: string;
    from?: string;
    to?: string;
    propertyId?: string;
  }>;
}

const SCOPE_LABEL: Record<string, string> = {
  ROOM: 'Per Kamar',
  BUILDING: 'Gedung',
};

export default async function MaintenancePage({ searchParams }: Props) {
  const { scope, floorId, from, to, propertyId } = await searchParams;
  const scopedPropertyId = await getPropertyScope(propertyId);
  const [records, floors, session] = await Promise.all([
    maintenanceService.list({
      scope: scope === 'ROOM' || scope === 'BUILDING' ? scope : undefined,
      propertyId: scopedPropertyId,
      floorId: floorId || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    }),
    roomService.listFloors(scopedPropertyId),
    getSession(),
  ]);
  const canCreate = session && ['SUPER_ADMIN', 'OPERASIONAL'].includes(session.user.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Maintenance
          </Typography>
          <Typography variant="muted">Riwayat perawatan kamar &amp; gedung.</Typography>
        </div>
        {canCreate && (
          <Link href="/admin/maintenance/new">
            <Button>Catatan Baru</Button>
          </Link>
        )}
      </div>

      <Card noPadding>
        <CardContent className="p-4">
          <form method="get" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-3xl lg:grid-cols-4">
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
              <Select
                name="floorId"
                label="Lantai"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={floorId ?? ''}
                options={floors.map((floor) => ({ value: floor.id, label: floor.name }))}
              />
              <DatePicker label="Dari Tanggal" name="from" size="sm" defaultValue={from} />
              <DatePicker label="Sampai Tanggal" name="to" size="sm" defaultValue={to} />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="shrink-0">
              Terapkan Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">Tanggal</th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">Scope</th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">Kategori</th>
              <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wide text-foreground-muted">Biaya</th>
              <th className="py-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-border">
                <td className="py-2.5 pr-4 tabular-nums text-foreground-muted">
                  {formatDate(record.date, 'id-ID')}
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit">
                      {SCOPE_LABEL[record.scope]}
                      {record.room ? ` — No. ${record.room.number} ${record.room.floor ? `(${record.room.floor.name})` : ''}` : ''}
                    </Badge>
                    <span className="text-xs text-foreground-muted">{record.property.name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-foreground">{record.category}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {record.cost ? formatRupiah(record.cost.toNumber()) : '—'}
                </td>
                <td className="py-2.5 text-foreground-muted">{record.vendor ?? '—'}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-foreground-muted">
                  Belum ada catatan maintenance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
