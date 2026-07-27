import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { roomService } from '@/services/room.service';

import { IncidentForm } from '../IncidentForm';

export default async function NewIncidentPage() {
  const rooms = await roomService.list();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Insiden Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentForm rooms={rooms} />
        </CardContent>
      </Card>
    </div>
  );
}
