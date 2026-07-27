import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { facilityService } from '@/services/facility.service';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';

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

  const [floors, facilities] = await Promise.all([
    roomService.listFloors(propertyId),
    facilityService.list(),
  ]);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Kamar/Unit — {property.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm
            action={createRoomAction}
            propertyId={propertyId}
            floors={floors}
            facilities={facilities}
            submitLabel="Simpan Kamar/Unit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
