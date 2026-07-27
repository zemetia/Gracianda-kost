import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { roomService } from '@/services/room.service';

import { deactivateRoomAction } from './actions';
import { NewFloorForm } from './NewFloorForm';

export default async function RoomsPage() {
  const [rooms, floors] = await Promise.all([roomService.list(), roomService.listFloors()]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Kamar
          </Typography>
          <Typography variant="muted">Kelola data kamar, harga, dan fasilitas.</Typography>
        </div>
        <Link href="/admin/master-data/rooms/new">
          <Button>Tambah Kamar</Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Lantai
          </Typography>
          <div className="mb-4 flex flex-wrap gap-2">
            {floors.map((floor) => (
              <Badge key={floor.id} variant="outline">
                {floor.name}
              </Badge>
            ))}
            {floors.length === 0 && (
              <Typography variant="muted">Belum ada lantai — tambahkan dulu di bawah.</Typography>
            )}
          </div>
          <NewFloorForm />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nomor</th>
              <th className="px-4 py-3 font-medium">Lantai</th>
              <th className="px-4 py-3 font-medium">Harga</th>
              <th className="px-4 py-3 font-medium">Okupansi</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="px-4 py-3 font-medium text-foreground">{room.number}</td>
                <td className="px-4 py-3 text-foreground-muted">{room.floor.name}</td>
                <td className="px-4 py-3 text-foreground-muted">
                  Rp {room.price.toNumber().toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={room.contracts.length > 0 ? 'destructive' : 'success'}>
                    {room.contracts.length > 0 ? 'Terisi' : 'Tersedia'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={room.isActive ? 'success' : 'outline'}>
                    {room.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/master-data/rooms/${room.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    {room.isActive && (
                      <form action={deactivateRoomAction.bind(null, room.id)}>
                        <Button variant="ghost" size="sm" type="submit">
                          Nonaktifkan
                        </Button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground-subtle">
                  Belum ada kamar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
