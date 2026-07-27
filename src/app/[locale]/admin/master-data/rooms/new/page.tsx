import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { facilityService } from '@/services/facility.service';
import { roomService } from '@/services/room.service';

import { createRoomAction } from '../actions';
import { RoomForm } from '../RoomForm';

export default async function NewRoomPage() {
  const [floors, facilities] = await Promise.all([roomService.listFloors(), facilityService.list()]);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Kamar</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm
            action={createRoomAction}
            floors={floors}
            facilities={facilities}
            submitLabel="Simpan Kamar"
          />
        </CardContent>
      </Card>
    </div>
  );
}
