import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/PageHeader';
import { facilityService } from '@/services/facility.service';
import { propertyService } from '@/services/property.service';

import { createRoomTypeAction } from '../actions';
import { RoomTypeForm } from '../RoomTypeForm';

interface Props {
  searchParams: Promise<{ propertyId?: string }>;
}

export default async function NewRoomTypePage({ searchParams }: Props) {
  const { propertyId } = await searchParams;
  if (!propertyId) notFound();

  const property = await propertyService.getById(propertyId);
  if (!property) notFound();

  const facilities = await facilityService.listAssignable();

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Tambah Tipe Kamar"
        description={property.name}
        backHref="/admin/master-data/room-types"
        backLabel="Daftar Tipe"
      />

      <RoomTypeForm
        action={createRoomTypeAction}
        propertyId={propertyId}
        facilities={facilities}
        submitLabel="Simpan Tipe"
      />
    </div>
  );
}
