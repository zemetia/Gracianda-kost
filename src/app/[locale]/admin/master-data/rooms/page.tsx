import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';

import { deactivateRoomAction } from './actions';
import { NewFloorForm } from './NewFloorForm';

interface Props {
  searchParams: Promise<{ propertyId?: string }>;
}

export default async function RoomsPage({ searchParams }: Props) {
  const { propertyId } = await searchParams;
  const activeProperties = await propertyService.listActive();

  let selectedPropertyId = propertyId;
  if (!selectedPropertyId && activeProperties.length > 0) {
    selectedPropertyId = activeProperties[0]?.id;
  }

  const selectedProperty = activeProperties.find((p) => p.id === selectedPropertyId);

  const [rooms, floors] = await Promise.all([
    selectedPropertyId ? roomService.list(selectedPropertyId) : Promise.resolve([]),
    selectedPropertyId ? roomService.listFloors(selectedPropertyId) : Promise.resolve([]),
  ]);

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
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised text-left text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nomor/Nama Unit</th>
                  <th className="px-4 py-3 font-medium">Lantai</th>
                  <th className="px-4 py-3 font-medium">Harga / Bulan</th>
                  <th className="px-4 py-3 font-medium">Okupansi</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{room.number}</td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {room.floor?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      Rp {room.price.toNumber().toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={room.contracts.length > 0 ? 'destructive' : 'success'}>
                        {room.contracts.length > 0 ? 'Terisi' : 'Tersedia'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={room.isActive ? 'success' : 'outline'}>
                        {room.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
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
                    <td colSpan={6} className="px-4 py-8 text-center text-foreground-subtle">
                      Belum ada kamar atau unit hunian terdaftar.
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
