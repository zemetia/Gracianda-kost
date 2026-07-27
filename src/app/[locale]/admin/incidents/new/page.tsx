import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';

import { IncidentForm } from '../IncidentForm';

export default async function NewIncidentPage() {
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
