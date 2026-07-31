'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { duplicateRoomSchema, floorSchema, roomSchema } from '@/lib/validations';
import { roomService } from '@/services/room.service';
import { attachmentService } from '@/services/attachment.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface RoomFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseRoomForm(formData: FormData) {
  return roomSchema.safeParse({
    number: formData.get('number'),
    propertyId: formData.get('propertyId'),
    floorId: formData.get('floorId') || undefined,
    roomTypeId: formData.get('roomTypeId') || undefined,
    price: formData.get('price'),
    lengthM: formData.get('lengthM') || undefined,
    widthM: formData.get('widthM') || undefined,
    description: formData.get('description') || undefined,
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

export async function createRoomAction(
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parseRoomForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const room = await roomService.create(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Room',
      entityId: room.id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan kamar' };
  }

  revalidatePath('/admin/master-data/rooms');
  return {};
}

export async function updateRoomAction(
  id: string,
  _prevState: RoomFormState,
  formData: FormData,
): Promise<RoomFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parseRoomForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await roomService.update(id, parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Room',
      entityId: id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan kamar' };
  }

  revalidatePath('/admin/master-data/rooms');
  revalidatePath(`/admin/master-data/rooms/${id}`);
  return {};
}

export async function deactivateRoomAction(id: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  await roomService.deactivate(id);
  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Room',
    entityId: id,
    after: { isActive: false },
  });
  revalidatePath('/admin/master-data/rooms');
}

export interface DuplicateRoomState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  createdCount?: number;
}

export async function duplicateRoomAction(
  roomId: string,
  _prevState: DuplicateRoomState,
  formData: FormData,
): Promise<DuplicateRoomState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = duplicateRoomSchema.safeParse({
    mode: formData.get('mode') || 'SEQUENCE',
    count: formData.get('count') || undefined,
    prefix: formData.get('prefix') || undefined,
    startNumber: formData.get('startNumber') || undefined,
    numbers: formData.get('numbers') || undefined,
    floorId: formData.get('floorId') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  let created;
  try {
    created = await roomService.duplicate(roomId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menduplikasi kamar' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Room',
    entityId: roomId,
    after: { duplicatedInto: created.map((room) => room.number) },
  });

  revalidatePath('/admin/master-data/rooms');
  return { createdCount: created.length };
}

export interface FloorFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createFloorAction(
  _prevState: FloorFormState,
  formData: FormData,
): Promise<FloorFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = floorSchema.safeParse({
    name: formData.get('name'),
    order: formData.get('order'),
    propertyId: formData.get('propertyId'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const floor = await roomService.createFloor(parsed.data);
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Floor',
    entityId: floor.id,
    after: parsed.data,
  });

  revalidatePath('/admin/master-data/rooms');
  return {};
}

export async function uploadRoomPhotoAction(roomId: string, formData: FormData): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  const kind = file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO';
  const attachment = await attachmentService.upload({
    file,
    entityType: 'ROOM',
    entityId: roomId,
    kind,
  });
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Attachment',
    entityId: attachment.id,
    after: { entityType: 'ROOM', entityId: roomId, kind, url: attachment.url },
  });
  revalidatePath(`/admin/master-data/rooms/${roomId}`);
}

export async function removeRoomPhotoAction(roomId: string, attachmentId: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const removed = await attachmentService.remove(attachmentId);
  await auditService.log({
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'Attachment',
    entityId: attachmentId,
    before: { entityType: 'ROOM', entityId: roomId, kind: removed.kind, url: removed.url },
  });
  revalidatePath(`/admin/master-data/rooms/${roomId}`);
}
