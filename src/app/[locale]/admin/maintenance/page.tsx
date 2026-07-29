import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
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

      <Card>
        <CardContent>
          <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <Input label="Dari Tanggal" name="from" type="date" defaultValue={from} />
            <Input label="Sampai Tanggal" name="to" type="date" defaultValue={to} />
            <Button type="submit" variant="secondary" className="col-span-2 self-end sm:col-span-4 sm:w-fit">
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
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Biaya</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-3 text-foreground-muted">{record.date.toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit">
                      {SCOPE_LABEL[record.scope]}
                      {record.room ? ` — No. ${record.room.number} ${record.room.floor ? `(${record.room.floor.name})` : ''}` : ''}
                    </Badge>
                    <span className="text-[10px] text-foreground-muted">{record.property.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{record.category}</td>
                <td className="px-4 py-3 text-foreground-muted">
                  {record.cost ? `Rp ${record.cost.toNumber().toLocaleString('id-ID')}` : '—'}
                </td>
                <td className="px-4 py-3 text-foreground-muted">{record.vendor ?? '—'}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground-subtle">
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
