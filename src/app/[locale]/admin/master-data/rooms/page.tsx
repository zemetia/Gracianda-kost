import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getPropertyScope } from '@/lib/property-scope';
import { parseRecordStatus } from '@/lib/record-status';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';

import { StatusFilter } from '../StatusFilter';
import { NewFloorForm } from './NewFloorForm';
import { RoomCard } from './RoomCard';

type Occupancy = 'all' | 'occupied' | 'available';

const OCCUPANCY_TABS: { value: Occupancy; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'occupied', label: 'Terisi' },
  { value: 'available', label: 'Tersedia' },
];

interface Props {
  searchParams: Promise<{ propertyId?: string; occupancy?: string; status?: string }>;
}

export default async function RoomsPage({ searchParams }: Props) {
  const { propertyId, occupancy, status } = await searchParams;
  const selectedStatus = parseRecordStatus(status);
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

  const [allRooms, floors, statusCounts] = await Promise.all([
    selectedPropertyId ? roomService.list(selectedPropertyId, selectedStatus) : Promise.resolve([]),
    selectedPropertyId ? roomService.listFloors(selectedPropertyId) : Promise.resolve([]),
    selectedPropertyId
      ? roomService.counts(selectedPropertyId)
      : Promise.resolve({ active: 0, inactive: 0 }),
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
          {/* Status first: aktif and nonaktif are two separate lists, and the
              occupancy tabs below always describe whichever one is open. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <StatusFilter
              status={selectedStatus}
              counts={statusCounts}
              basePath="/admin/master-data/rooms"
              params={{
                propertyId: selectedPropertyId,
                ...(selectedOccupancy === 'all' ? {} : { occupancy: selectedOccupancy }),
              }}
            />

            {/* Occupancy filter — the target of the dashboard's "Unit Terisi/Kosong" tiles */}
            <div className="flex flex-wrap gap-2">
            {OCCUPANCY_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={`/admin/master-data/rooms?propertyId=${selectedPropertyId}${
                  tab.value === 'all' ? '' : `&occupancy=${tab.value}`
                }${selectedStatus === 'active' ? '' : `&status=${selectedStatus}`}`}
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
          </div>

          {/* Floor Management Card (Only relevant for properties using floors e.g., KOST/APARTMENT) */}
          {(selectedProperty.type === 'KOST' || selectedProperty.type === 'APARTMENT') && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <Typography variant="h6">Lantai</Typography>
                  <NewFloorForm propertyId={selectedPropertyId} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {floors.map((floor) => (
                    <Badge key={floor.id} variant="outline">
                      {floor.name}
                    </Badge>
                  ))}
                  {floors.length === 0 && (
                    <Typography variant="muted">Belum ada lantai — tambahkan dengan tombol di atas.</Typography>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rooms / Units Grid — entity cards read better than a table here: price,
              occupancy, and status all matter at a glance, and units get duplicated
              in batches rather than scanned row by row. */}
          {rooms.length === 0 ? (
            <p className="text-foreground-muted py-12 text-center text-sm">
              {selectedStatus === 'inactive'
                ? 'Tidak ada unit yang dinonaktifkan.'
                : selectedOccupancy === 'all'
                  ? 'Belum ada kamar atau unit hunian terdaftar.'
                  : 'Tidak ada unit pada filter ini.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  id={room.id}
                  number={room.number}
                  floorId={room.floorId}
                  floorName={room.floor?.name ?? null}
                  roomTypeId={room.roomTypeId}
                  roomTypeName={room.roomType?.name ?? null}
                  price={room.price.toNumber()}
                  isActive={room.isActive}
                  isOccupied={room.contracts.length > 0}
                  floors={floors.map((floor) => ({ id: floor.id, name: floor.name }))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
