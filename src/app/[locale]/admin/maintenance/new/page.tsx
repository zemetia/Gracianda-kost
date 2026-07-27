import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { roomService } from '@/services/room.service';
import { maintenanceService } from '@/services/maintenance.service';

import { MaintenanceForm } from '../MaintenanceForm';

export default async function NewMaintenancePage() {
  const [rooms, categories] = await Promise.all([roomService.list(), maintenanceService.listCategories()]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Catatan Maintenance Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <MaintenanceForm rooms={rooms} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
