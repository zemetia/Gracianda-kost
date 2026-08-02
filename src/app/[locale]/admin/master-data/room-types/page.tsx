import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getPropertyScope } from '@/lib/property-scope';
import { parseRecordStatus } from '@/lib/record-status';
import { propertyService } from '@/services/property.service';
import { roomTypeService } from '@/services/room-type.service';

import { StatusFilter } from '../StatusFilter';
import { RoomTypeCard } from './RoomTypeCard';

interface Props {
  searchParams: Promise<{ propertyId?: string; status?: string }>;
}

export default async function RoomTypesPage({ searchParams }: Props) {
  const { propertyId, status } = await searchParams;
  const selectedStatus = parseRecordStatus(status);
  const activeProperties = await propertyService.listActive();

  let selectedPropertyId = await getPropertyScope(propertyId);
  if (!selectedPropertyId && activeProperties.length > 0) {
    selectedPropertyId = activeProperties[0]?.id;
  }

  const [roomTypes, statusCounts] = await Promise.all([
    selectedPropertyId
      ? roomTypeService.list(selectedPropertyId, selectedStatus)
      : Promise.resolve([]),
    selectedPropertyId
      ? roomTypeService.counts(selectedPropertyId)
      : Promise.resolve({ active: 0, inactive: 0 }),
  ]);

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
          <StatusFilter
            status={selectedStatus}
            counts={statusCounts}
            basePath="/admin/master-data/room-types"
            params={{ propertyId: selectedPropertyId }}
          />

          {roomTypes.length === 0 ? (
            <p className="text-foreground-muted py-12 text-center text-sm">
              {selectedStatus === 'inactive'
                ? 'Tidak ada tipe kamar yang dinonaktifkan.'
                : 'Belum ada tipe kamar. Buat satu, lalu pilih tipenya saat menambah kamar.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roomTypes.map((type) => (
                <RoomTypeCard
                  key={type.id}
                  id={type.id}
                  propertyId={selectedPropertyId}
                  name={type.name}
                  price={type.price ? type.price.toNumber() : null}
                  facilityNames={type.facilities.map((f) => f.facility.name)}
                  roomCount={type._count.rooms}
                  isActive={type.isActive}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
