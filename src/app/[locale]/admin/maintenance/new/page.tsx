import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { roomService } from '@/services/room.service';
import { maintenanceService } from '@/services/maintenance.service';
import { propertyService } from '@/services/property.service';

import { MaintenanceForm } from '../MaintenanceForm';

export default async function NewMaintenancePage() {
  const [properties, rooms, categories] = await Promise.all([
    propertyService.listActive(),
    roomService.list(),
    maintenanceService.listCategories(),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Catatan Maintenance Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <MaintenanceForm
            properties={properties.map((p) => ({ id: p.id, name: p.name }))}
            rooms={rooms.map((r) => ({
              id: r.id,
              number: r.number,
              propertyId: r.propertyId,
              floor: r.floor ? { name: r.floor.name } : null,
            }))}
            categories={categories}
          />
        </CardContent>
      </Card>
    </div>
  );
}
