import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';

import { IncidentForm } from '../IncidentForm';

interface Props {
  searchParams: Promise<{ propertyId?: string; roomId?: string }>;
}

export default async function NewIncidentPage({ searchParams }: Props) {
  const { propertyId, roomId } = await searchParams;
  const [properties, rooms] = await Promise.all([
    propertyService.listActive(),
    roomService.list(),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Insiden Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentForm
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
            rooms={rooms.map((r) => ({
              id: r.id,
              number: r.number,
              propertyId: r.propertyId,
              floor: r.floor ? { name: r.floor.name } : null,
            }))}
            initialPropertyId={propertyId}
            initialRoomId={roomId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
