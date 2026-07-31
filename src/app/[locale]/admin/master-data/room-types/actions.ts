'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { roomTypeSchema } from '@/lib/validations';
import { attachmentService } from '@/services/attachment.service';
import { auditService } from '@/services/audit.service';
import { roomTypeService } from '@/services/room-type.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface RoomTypeFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseRoomTypeForm(formData: FormData) {
  return roomTypeSchema.safeParse({
    name: formData.get('name'),
    propertyId: formData.get('propertyId'),
    description: formData.get('description') || undefined,
    sizeSqm: formData.get('sizeSqm') || undefined,
    price: formData.get('price') || undefined,
    electricityMode: formData.get('electricityMode') || undefined,
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
    facilityIds: formData.getAll('facilityIds'),
    priceDaily: formData.get('priceDaily') || undefined,
    priceWeekly: formData.get('priceWeekly') || undefined,
    priceQuarterly: formData.get('priceQuarterly') || undefined,
    priceSemiAnnual: formData.get('priceSemiAnnual') || undefined,
    priceYearly: formData.get('priceYearly') || undefined,
  });
}

export async function createRoomTypeAction(
  _prevState: RoomTypeFormState,
  formData: FormData,
): Promise<RoomTypeFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parseRoomTypeForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const roomType = await roomTypeService.create(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'RoomType',
      entityId: roomType.id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan tipe kamar' };
  }

  revalidatePath('/admin/master-data/room-types');
  return {};
}

export async function updateRoomTypeAction(
  id: string,
  _prevState: RoomTypeFormState,
  formData: FormData,
): Promise<RoomTypeFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parseRoomTypeForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await roomTypeService.update(id, parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'RoomType',
      entityId: id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan tipe kamar' };
  }

  revalidatePath('/admin/master-data/room-types');
  revalidatePath(`/admin/master-data/room-types/${id}`);
  // Rooms inherit facilities and photos from the type — their pages are stale now.
  revalidatePath('/admin/master-data/rooms');
  return {};
}

export async function deactivateRoomTypeAction(id: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  await roomTypeService.deactivate(id);
  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'RoomType',
    entityId: id,
    after: { isActive: false },
  });
  revalidatePath('/admin/master-data/room-types');
}

export async function uploadRoomTypePhotoAction(
  roomTypeId: string,
  formData: FormData,
): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  const kind = file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO';
  const attachment = await attachmentService.upload({
    file,
    entityType: 'ROOM_TYPE',
    entityId: roomTypeId,
    kind,
  });
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Attachment',
    entityId: attachment.id,
    after: { entityType: 'ROOM_TYPE', entityId: roomTypeId, kind, url: attachment.url },
  });
  revalidatePath(`/admin/master-data/room-types/${roomTypeId}`);
}

export async function removeRoomTypePhotoAction(
  roomTypeId: string,
  attachmentId: string,
): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const removed = await attachmentService.remove(attachmentId);
  await auditService.log({
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'Attachment',
    entityId: attachmentId,
    before: { entityType: 'ROOM_TYPE', entityId: roomTypeId, kind: removed.kind, url: removed.url },
  });
  revalidatePath(`/admin/master-data/room-types/${roomTypeId}`);
}
