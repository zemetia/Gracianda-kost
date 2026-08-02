import { PageHeader } from '@/components/ui/PageHeader';
import { incidentService } from '@/services/incident.service';
import { roomService } from '@/services/room.service';
import { propertyService } from '@/services/property.service';

import { IncidentForm } from '../IncidentForm';

interface Props {
  searchParams: Promise<{ propertyId?: string; roomId?: string }>;
}

export default async function NewIncidentPage({ searchParams }: Props) {
  const { propertyId, roomId } = await searchParams;
  const [properties, rooms, candidates] = await Promise.all([
    propertyService.listActive(),
    roomService.list(undefined, 'all'),
    // Every property, not just the scoped one: the form narrows the picker
    // client-side once a property is chosen.
    incidentService.listPersonCandidates(),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Laporan Insiden Baru"
        description="Catat kejadian selagi detailnya masih segar — laporan ini yang jadi dasar tindak lanjut."
        backHref="/admin/incidents"
        backLabel="Daftar Insiden"
      />

      <IncidentForm
        properties={properties.map((p) => ({ id: p.id, name: p.name }))}
        rooms={rooms.map((r) => ({
          id: r.id,
          number: r.number,
          propertyId: r.propertyId,
          floor: r.floor ? { name: r.floor.name } : null,
        }))}
        candidates={candidates}
        initialPropertyId={propertyId}
        initialRoomId={roomId}
      />
    </div>
  );
}
