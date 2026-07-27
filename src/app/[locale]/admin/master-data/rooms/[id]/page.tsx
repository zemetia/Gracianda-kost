import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { facilityService } from '@/services/facility.service';
import { roomService } from '@/services/room.service';
import { attachmentService } from '@/services/attachment.service';

import { updateRoomAction } from '../actions';
import { RoomForm } from '../RoomForm';
import { RoomPhotos } from './RoomPhotos';

interface Props {
  params: Promise<{ id: string }>;
}

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  ENDED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default async function EditRoomPage({ params }: Props) {
  const { id } = await params;
  const [room, floors, facilities, attachments, history] = await Promise.all([
    roomService.getById(id),
    roomService.listFloors(),
    facilityService.list(),
    attachmentService.listFor('ROOM', id),
    roomService.getRoomHistory(id),
  ]);

  if (!room) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Kamar {room.number}</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm
            action={updateRoomAction.bind(null, id)}
            floors={floors}
            facilities={facilities}
            submitLabel="Simpan Perubahan"
            initial={{
              number: room.number,
              floorId: room.floorId,
              price: room.price.toNumber(),
              sizeSqm: room.sizeSqm ? room.sizeSqm.toNumber() : null,
              description: room.description,
              isActive: room.isActive,
              facilityIds: room.facilities.map((f) => f.facilityId),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto &amp; Video</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomPhotos roomId={id} attachments={attachments} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kamar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <Typography variant="muted">Total Pemasukan</Typography>
              <Typography variant="p">Rp {history.totalIncome.toLocaleString('id-ID')}</Typography>
            </div>
            <div>
              <Typography variant="muted">Total Biaya Maintenance</Typography>
              <Typography variant="p">Rp {history.totalCost.toLocaleString('id-ID')}</Typography>
            </div>
            <div>
              <Typography variant="muted">Profitabilitas Bersih</Typography>
              <Typography variant="p">Rp {history.netProfitability.toLocaleString('id-ID')}</Typography>
            </div>
          </div>

          <div>
            <Typography variant="h6" as="p" className="mb-2">
              Riwayat Kontrak
            </Typography>
            <div className="flex flex-col gap-2">
              {history.contracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="text-foreground">
                    {contract.tenant.fullName} — {contract.contractCode}
                  </span>
                  <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {CONTRACT_STATUS_LABEL[contract.status]}
                  </Badge>
                </div>
              ))}
              {history.contracts.length === 0 && (
                <Typography variant="muted">Belum ada riwayat kontrak.</Typography>
              )}
            </div>
          </div>

          <div>
            <Typography variant="h6" as="p" className="mb-2">
              Riwayat Maintenance
            </Typography>
            <div className="flex flex-col gap-2">
              {history.maintenance.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="text-foreground">
                    {record.category} — {record.date.toLocaleDateString('id-ID')}
                  </span>
                  <span className="text-foreground-muted">
                    {record.cost ? `Rp ${record.cost.toNumber().toLocaleString('id-ID')}` : '—'}
                  </span>
                </div>
              ))}
              {history.maintenance.length === 0 && (
                <Typography variant="muted">Belum ada riwayat maintenance.</Typography>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
