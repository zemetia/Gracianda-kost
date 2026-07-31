import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { facilityService } from '@/services/facility.service';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';
import { roomTypeService } from '@/services/room-type.service';

import { createRoomAction } from '../actions';
import { RoomForm } from '../RoomForm';

interface Props {
  searchParams: Promise<{ propertyId?: string }>;
}

export default async function NewRoomPage({ searchParams }: Props) {
  const { propertyId } = await searchParams;

  if (!propertyId) notFound();

  // Verify the property exists
  const property = await propertyService.getById(propertyId);
  if (!property) notFound();

  const [floors, facilities, roomTypes] = await Promise.all([
    roomService.listFloors(propertyId),
    facilityService.list(),
    roomTypeService.getFormDefaults(propertyId),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Tambah Kamar/Unit"
        description={property.name}
        backHref="/admin/master-data/rooms"
        backLabel="Daftar Kamar"
      />

      <RoomForm
        action={createRoomAction}
        propertyId={propertyId}
        floors={floors}
        facilities={facilities}
        roomTypes={roomTypes}
        submitLabel="Simpan Kamar/Unit"
      />
    </div>
  );
}
