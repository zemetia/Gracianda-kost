import { CalendarPlus, ShieldAlert, Wrench } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { MetricBlock, MetricRow } from '@/components/ui/Metric';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { formatDate, formatNumber, formatRupiah } from '@/lib/utils';
import { facilityService } from '@/services/facility.service';
import { roomService } from '@/services/room.service';
import { attachmentService } from '@/services/attachment.service';
import { contractService } from '@/services/contract.service';
import { roomTypeService } from '@/services/room-type.service';

import { MediaGallery } from '../../MediaGallery';
import { removeRoomPhotoAction, updateRoomAction, uploadRoomPhotoAction } from '../actions';
import { DuplicateRoomDialog } from '../DuplicateRoomDialog';
import { RoomForm } from '../RoomForm';

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

  const [floors, facilities, roomTypes, ownAttachments, history, activeContract] = await Promise.all(
    [
      roomService.listFloors(room.propertyId),
      facilityService.listAssignable(),
      roomTypeService.getFormDefaults(room.propertyId),
      attachmentService.listFor('ROOM', id),
      roomService.getRoomHistory(id),
      contractService.getActiveByRoom(id),
    ],
  );

  // Same override rule as the public page: own media wins, otherwise the
  // type's gallery is what visitors actually see for this unit.
  const typeAttachments =
    ownAttachments.length === 0 && room.roomTypeId
      ? await attachmentService.listFor('ROOM_TYPE', room.roomTypeId)
      : [];
  const inheritsMedia = ownAttachments.length === 0 && typeAttachments.length > 0;

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
    <div className="flex max-w-5xl flex-col gap-8">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Kamar {room.number} — {room.property.name}</CardTitle>
            <CardDescription>
              {roomLabel}
              {room.roomType ? ` · Tipe ${room.roomType.name}` : ''}
            </CardDescription>
          </div>
          <DuplicateRoomDialog
            roomId={id}
            roomNumber={room.number}
            floorId={room.floorId}
            floors={floors}
          />
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

      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Edit Kamar</h2>
        <div>
          <RoomForm
            action={updateRoomAction.bind(null, id)}
            propertyId={room.propertyId}
            floors={floors}
            facilities={facilities}
            roomTypes={roomTypes}
            submitLabel="Simpan Perubahan"
            initial={{
              number: room.number,
              floorId: room.floorId,
              roomTypeId: room.roomTypeId,
              price: room.price.toNumber(),
              lengthM: room.lengthM ? room.lengthM.toNumber() : null,
              widthM: room.widthM ? room.widthM.toNumber() : null,
              description: room.description,
              electricityMode: room.electricityMode,
              isActive: room.isActive,
              facilityIds: room.facilities.map((f) => f.facilityId),
              prices: room.prices.map((p) => ({
                billingCycle: p.billingCycle,
                interval: p.interval,
                price: p.price.toNumber(),
              })),
            }}
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Foto &amp; Video</CardTitle>
        </CardHeader>
        <CardContent>
          <MediaGallery
            entityId={id}
            attachments={inheritsMedia ? typeAttachments : ownAttachments}
            readOnly={inheritsMedia}
            onUpload={uploadRoomPhotoAction}
            onRemove={removeRoomPhotoAction}
            notice={
              inheritsMedia
                ? `Menampilkan foto tipe ${room.roomType?.name}. Begitu kamar ini punya fotonya sendiri, foto tipe tidak lagi dipakai untuk unit ini.`
                : undefined
            }
            emptyLabel={
              room.roomType
                ? `Belum ada foto — tipe ${room.roomType.name} juga belum punya.`
                : 'Belum ada foto/video.'
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kamar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <MetricRow columns={3} bordered={false} className="gap-6 lg:gap-0">
            <MetricBlock
              label="Total Pemasukan"
              value={formatNumber(history.totalIncome)}
              prefix="Rp"
              size="secondary"
            />
            <MetricBlock
              label="Total Biaya Maintenance"
              value={formatNumber(history.totalCost)}
              prefix="Rp"
              size="secondary"
            />
            <MetricBlock
              label="Profitabilitas Bersih"
              value={formatNumber(history.netProfitability)}
              prefix="Rp"
              size="secondary"
              tone={history.netProfitability < 0 ? 'destructive' : 'default'}
            />
          </MetricRow>

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
                    {record.category} — {formatDate(record.date, 'id-ID')}
                  </span>
                  <span className="tabular-nums text-foreground-muted">
                    {record.cost ? formatRupiah(record.cost.toNumber()) : '—'}
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
