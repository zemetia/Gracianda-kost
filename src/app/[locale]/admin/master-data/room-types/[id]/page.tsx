import { notFound } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { attachmentService } from '@/services/attachment.service';
import { facilityService } from '@/services/facility.service';
import { roomTypeService } from '@/services/room-type.service';

import { MediaGallery } from '../../MediaGallery';
import {
  removeRoomTypePhotoAction,
  updateRoomTypeAction,
  uploadRoomTypePhotoAction,
} from '../actions';
import { RoomTypeForm } from '../RoomTypeForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRoomTypePage({ params }: Props) {
  const { id } = await params;
  const roomType = await roomTypeService.getById(id);
  if (!roomType) notFound();

  const [facilities, attachments] = await Promise.all([
    facilityService.list(),
    attachmentService.listFor('ROOM_TYPE', id),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title={roomType.name}
        description={`${roomType.property.name} — dipakai ${roomType._count.rooms} kamar`}
        backHref="/admin/master-data/room-types"
        backLabel="Daftar Tipe"
      />

      <RoomTypeForm
        action={updateRoomTypeAction.bind(null, id)}
        propertyId={roomType.propertyId}
        facilities={facilities}
        submitLabel="Simpan Perubahan"
        initial={{
          name: roomType.name,
          description: roomType.description,
          sizeSqm: roomType.sizeSqm ? roomType.sizeSqm.toNumber() : null,
          price: roomType.price ? roomType.price.toNumber() : null,
          electricityMode: roomType.electricityMode,
          isActive: roomType.isActive,
          facilityIds: roomType.facilities.map((f) => f.facilityId),
          prices: roomType.prices.map((p) => ({
            billingCycle: p.billingCycle,
            interval: p.interval,
            price: p.price.toNumber(),
          })),
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Foto &amp; Video Tipe</CardTitle>
          <CardDescription>
            Tampil di halaman publik untuk setiap kamar bertipe ini yang belum punya fotonya sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaGallery
            entityId={id}
            attachments={attachments}
            onUpload={uploadRoomTypePhotoAction}
            onRemove={removeRoomTypePhotoAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}
