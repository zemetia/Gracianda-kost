import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getPropertyScope } from '@/lib/property-scope';
import { formatRupiah } from '@/lib/utils';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';

import { deactivateRoomAction } from './actions';
import { NewFloorForm } from './NewFloorForm';

type Occupancy = 'all' | 'occupied' | 'available';

const OCCUPANCY_TABS: { value: Occupancy; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'occupied', label: 'Terisi' },
  { value: 'available', label: 'Tersedia' },
];

interface Props {
  searchParams: Promise<{ propertyId?: string; occupancy?: string }>;
}

export default async function RoomsPage({ searchParams }: Props) {
  const { propertyId, occupancy } = await searchParams;
  const activeProperties = await propertyService.listActive();

  // Rooms are always viewed one property at a time (floors and denah only make
  // sense per building), so the global scope picks the property and the tabs
  // below stay as the explicit override.
  let selectedPropertyId = await getPropertyScope(propertyId);
  if (!selectedPropertyId && activeProperties.length > 0) {
    selectedPropertyId = activeProperties[0]?.id;
  }

  const selectedProperty = activeProperties.find((p) => p.id === selectedPropertyId);
  const selectedOccupancy: Occupancy =
    occupancy === 'occupied' || occupancy === 'available' ? occupancy : 'all';

  const [allRooms, floors] = await Promise.all([
    selectedPropertyId ? roomService.list(selectedPropertyId) : Promise.resolve([]),
    selectedPropertyId ? roomService.listFloors(selectedPropertyId) : Promise.resolve([]),
  ]);

  const rooms = allRooms.filter((room) => {
    if (selectedOccupancy === 'all') return true;
    const isOccupied = room.contracts.length > 0;
    return selectedOccupancy === 'occupied' ? isOccupied : !isOccupied;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Kamar & Unit
          </Typography>
          <Typography variant="muted">Kelola data kamar, harga, dan fasilitas hunian.</Typography>
        </div>
        {selectedPropertyId && (
          <Link href={`/admin/master-data/rooms/new?propertyId=${selectedPropertyId}`}>
            <Button>Tambah Kamar/Unit</Button>
          </Link>
        )}
      </div>

      {/* Property Selector Tabs */}
      <div className="flex gap-2 border-b border-border pb-px overflow-x-auto">
        {activeProperties.map((prop) => (
          <Link
            key={prop.id}
            href={`/admin/master-data/rooms?propertyId=${prop.id}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-all shrink-0 ${
              selectedPropertyId === prop.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            {prop.name} ({prop.code})
          </Link>
        ))}
        {activeProperties.length === 0 && (
          <Typography variant="muted" className="py-2">
            Belum ada properti aktif. Tambahkan properti terlebih dahulu di menu Properti.
          </Typography>
        )}
      </div>

      {selectedPropertyId && selectedProperty && (
        <>
          {/* Occupancy filter — the target of the dashboard's "Unit Terisi/Kosong" tiles */}
          <div className="flex flex-wrap gap-2">
            {OCCUPANCY_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`/admin/master-data/rooms?propertyId=${selectedPropertyId}${
                  tab.value === 'all' ? '' : `&occupancy=${tab.value}`
                }`}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedOccupancy === tab.value
                    ? 'border-primary bg-primary-subtle text-primary'
                    : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground'
                }`}
              >
                {tab.label} (
                {tab.value === 'all'
                  ? allRooms.length
                  : allRooms.filter((room) =>
                      tab.value === 'occupied'
                        ? room.contracts.length > 0
                        : room.contracts.length === 0,
                    ).length}
                )
              </Link>
            ))}
          </div>

          {/* Floor Management Card (Only relevant for properties using floors e.g., KOST/APARTMENT) */}
          {(selectedProperty.type === 'KOST' || selectedProperty.type === 'APARTMENT') && (
            <Card>
              <CardContent>
                <Typography variant="h6" className="mb-3">
                  Lantai
                </Typography>
                <div className="mb-4 flex flex-wrap gap-2">
                  {floors.map((floor) => (
                    <Badge key={floor.id} variant="outline">
                      {floor.name}
                    </Badge>
                  ))}
                  {floors.length === 0 && (
                    <Typography variant="muted">Belum ada lantai — tambahkan dulu di bawah.</Typography>
                  )}
                </div>
                <NewFloorForm propertyId={selectedPropertyId} />
              </CardContent>
            </Card>
          )}

          {/* Rooms / Units List */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left [&>th]:py-2 [&>th]:pr-4 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-foreground-muted">
                  <th>Nomor/Nama Unit</th>
                  <th>Lantai</th>
                  <th className="text-right">Harga / Bulan</th>
                  <th>Okupansi</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-border [&>td]:py-2.5 [&>td]:pr-4">
                    <td className="font-medium text-foreground">{room.number}</td>
                    <td className="text-foreground-muted">{room.floor?.name || '—'}</td>
                    <td className="text-right tabular-nums">
                      {formatRupiah(room.price.toNumber())}
                    </td>
                    <td>
                      <Badge variant={room.contracts.length > 0 ? 'destructive' : 'success'}>
                        {room.contracts.length > 0 ? 'Terisi' : 'Tersedia'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={room.isActive ? 'success' : 'outline'}>
                        {room.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="pr-0 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/master-data/rooms/${room.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        {room.isActive && (
                          <form action={deactivateRoomAction.bind(null, room.id)}>
                            <Button variant="ghost" size="sm" type="submit">
                              Nonaktifkan
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-foreground-muted">
                      {selectedOccupancy === 'all'
                        ? 'Belum ada kamar atau unit hunian terdaftar.'
                        : 'Tidak ada unit pada filter ini.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
