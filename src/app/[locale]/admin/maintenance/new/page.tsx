import { PageHeader } from '@/components/ui/PageHeader';
import { roomService } from '@/services/room.service';
import { maintenanceService } from '@/services/maintenance.service';
import { propertyService } from '@/services/property.service';

import { MaintenanceForm } from '../MaintenanceForm';

interface Props {
  searchParams: Promise<{ propertyId?: string; roomId?: string }>;
}

export default async function NewMaintenancePage({ searchParams }: Props) {
  const { propertyId, roomId } = await searchParams;
  const [properties, rooms, categories] = await Promise.all([
    propertyService.listActive(),
    // Parked units included: a room taken offline for renovation is exactly
    // the one a maintenance record is being written for.
    roomService.list(undefined, 'all'),
    maintenanceService.listCategories(),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Catatan Maintenance Baru"
        description="Biaya di sini langsung masuk ke laporan keuangan kamar atau properti terkait."
        backHref="/admin/maintenance"
        backLabel="Daftar Maintenance"
      />

      <MaintenanceForm
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        rooms={rooms.map((r) => ({
          id: r.id,
          number: r.number,
          propertyId: r.propertyId,
          floor: r.floor ? { name: r.floor.name } : null,
        }))}
        categories={categories}
        initialPropertyId={propertyId}
        initialRoomId={roomId}
      />
    </div>
  );
}
