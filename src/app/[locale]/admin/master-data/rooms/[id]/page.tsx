import { CalendarPlus, ShieldAlert, Wrench } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { facilityService } from '@/services/facility.service';
import { roomService } from '@/services/room.service';
import { attachmentService } from '@/services/attachment.service';
import { contractService } from '@/services/contract.service';

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
  const room = await roomService.getById(id);

  if (!room) notFound();

  const [floors, facilities, attachments, history, activeContract] = await Promise.all([
    roomService.listFloors(room.propertyId),
    facilityService.list(),
    attachmentService.listFor('ROOM', id),
    roomService.getRoomHistory(id),
    contractService.getActiveByRoom(id),
  ]);

  const roomLabel = `No. ${room.number}${room.floor ? ` (${room.floor.name})` : ''}`;

  // The room is where an admin thinks in terms of a single unit — sewa,
  // maintenance, and insiden all start here instead of a bare module menu
  // where the admin has to re-pick the room from scratch each time.
  const quickActions = activeContract
    ? [
        {
          href: `/admin/contracts/${activeContract.id}`,
          icon: CalendarPlus,
          title: 'Lihat Kontrak Aktif',
          description: `Kamar terisi — ${activeContract.contractCode}.`,
        },
      ]
    : [
        {
          href: `/admin/contracts/new?roomId=${id}&propertyId=${room.propertyId}`,
          icon: CalendarPlus,
          title: 'Buat Kontrak',
          description: 'Sewakan kamar ini ke penyewa baru atau lama.',
        },
      ];
  quickActions.push(
    {
      href: `/admin/maintenance/new?roomId=${id}&propertyId=${room.propertyId}`,
      icon: Wrench,
      title: 'Catat Maintenance',
      description: 'Perbaikan atau perawatan untuk kamar ini.',
    },
    {
      href: `/admin/incidents/new?roomId=${id}&propertyId=${room.propertyId}`,
      icon: ShieldAlert,
      title: 'Lapor Insiden',
      description: 'Gangguan, kerusakan, atau keluhan terkait kamar ini.',
    },
  );

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Kamar {room.number} — {room.property.name}</CardTitle>
          <CardDescription>{roomLabel}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:border-primary/40 hover:bg-primary-subtle"
            >
              <action.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">{action.title}</span>
              <span className="text-xs leading-relaxed text-foreground-muted">
                {action.description}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Kamar</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomForm
            action={updateRoomAction.bind(null, id)}
            propertyId={room.propertyId}
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
              prices: room.prices.map((p) => ({
                billingCycle: p.billingCycle,
                interval: p.interval,
                price: p.price.toNumber(),
              })),
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
