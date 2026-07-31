import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
        <>
          {roomTypes.length === 0 ? (
            <p className="py-12 text-center text-sm text-foreground-muted">
              Belum ada tipe kamar. Buat satu, lalu pilih tipenya saat menambah kamar.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roomTypes.map((type) => (
                <Card key={type.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-base font-semibold text-foreground">{type.name}</p>
                    <Badge variant={type.isActive ? 'success' : 'outline'}>
                      {type.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  <p className="text-lg font-semibold tracking-tight tabular-nums text-foreground">
                    {type.price ? formatRupiah(type.price.toNumber()) : '—'}
                    <span className="ml-1 text-xs font-normal text-foreground-muted">/bulan (acuan)</span>
                  </p>

                  <p className="line-clamp-2 text-sm text-foreground-muted">
                    {type.facilities.length > 0
                      ? type.facilities.map((f) => f.facility.name).join(', ')
                      : 'Belum ada fasilitas ditambahkan.'}
                  </p>

                  <Link
                    href={`/admin/master-data/rooms?propertyId=${selectedPropertyId}`}
                    className="text-sm text-foreground-muted hover:text-primary hover:underline"
                  >
                    <span className="font-medium tabular-nums text-foreground">{type._count.rooms}</span>{' '}
                    kamar memakai tipe ini
                  </Link>

                  <div className="mt-auto flex justify-end gap-2 border-t border-border pt-3">
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
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
