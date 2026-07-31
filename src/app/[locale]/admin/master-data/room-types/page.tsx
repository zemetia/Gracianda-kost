import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getPropertyScope } from '@/lib/property-scope';
import { formatRupiah } from '@/lib/utils';
import { propertyService } from '@/services/property.service';
import { roomTypeService } from '@/services/room-type.service';

import { deactivateRoomTypeAction } from './actions';

interface Props {
  searchParams: Promise<{ propertyId?: string }>;
}

export default async function RoomTypesPage({ searchParams }: Props) {
  const { propertyId } = await searchParams;
  const activeProperties = await propertyService.listActive();

  let selectedPropertyId = await getPropertyScope(propertyId);
  if (!selectedPropertyId && activeProperties.length > 0) {
    selectedPropertyId = activeProperties[0]?.id;
  }

  const roomTypes = selectedPropertyId ? await roomTypeService.list(selectedPropertyId) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Tipe Kamar
          </Typography>
          <Typography variant="muted">
            Template fasilitas, foto, dan harga acuan untuk kamar yang bentuknya sama.
          </Typography>
        </div>
        {selectedPropertyId && (
          <Link href={`/admin/master-data/room-types/new?propertyId=${selectedPropertyId}`}>
            <Button>Tambah Tipe</Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border pb-px">
        {activeProperties.map((prop) => (
          <Link
            key={prop.id}
            href={`/admin/master-data/room-types?propertyId=${prop.id}`}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-all ${
              selectedPropertyId === prop.id
                ? 'border-primary font-bold text-primary'
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

      {selectedPropertyId && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left [&>th]:py-2 [&>th]:pr-4 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-foreground-muted">
                <th>Nama Tipe</th>
                <th className="text-right">Harga Acuan</th>
                <th>Fasilitas</th>
                <th className="text-right">Kamar</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((type) => (
                <tr key={type.id} className="border-b border-border [&>td]:py-2.5 [&>td]:pr-4">
                  <td className="font-medium text-foreground">{type.name}</td>
                  <td className="text-right tabular-nums">
                    {type.price ? formatRupiah(type.price.toNumber()) : '—'}
                  </td>
                  <td className="text-foreground-muted">
                    {type.facilities.length > 0
                      ? type.facilities.map((f) => f.facility.name).join(', ')
                      : '—'}
                  </td>
                  <td className="text-right tabular-nums">
                    <Link
                      href={`/admin/master-data/rooms?propertyId=${selectedPropertyId}`}
                      className="text-primary hover:underline"
                    >
                      {type._count.rooms}
                    </Link>
                  </td>
                  <td>
                    <Badge variant={type.isActive ? 'success' : 'outline'}>
                      {type.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="pr-0 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/master-data/room-types/${type.id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {type.isActive && (
                        <form action={deactivateRoomTypeAction.bind(null, type.id)}>
                          <Button variant="ghost" size="sm" type="submit">
                            Nonaktifkan
                          </Button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {roomTypes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted">
                    Belum ada tipe kamar. Buat satu, lalu pilih tipenya saat menambah kamar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
