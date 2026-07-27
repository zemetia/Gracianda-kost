'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { incidentSchema, incidentStatusSchema } from '@/lib/validations';
import { incidentService } from '@/services/incident.service';
import { auditService } from '@/services/audit.service';

const CAN_CREATE = ['SUPER_ADMIN', 'SECURITY', 'OPERASIONAL'];
const CAN_MANAGE = ['SUPER_ADMIN', 'SECURITY'];

export interface IncidentFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createIncidentAction(
  _prevState: IncidentFormState,
  formData: FormData,
): Promise<IncidentFormState> {
  const session = await requireRole(CAN_CREATE);
  const parsed = incidentSchema.safeParse({
    category: formData.get('category'),
    status: 'OPEN',
    date: formData.get('date'),
    roomId: formData.get('roomId') || undefined,
    location: formData.get('location') || undefined,
    description: formData.get('description'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const incident = await incidentService.create(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Incident',
      entityId: incident.id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan insiden' };
  }

  revalidatePath('/admin/incidents');
  return {};
}

export async function updateIncidentStatusAction(id: string, formData: FormData): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = incidentStatusSchema.safeParse({ status: formData.get('status') });
  if (!parsed.success) return;

  await incidentService.updateStatus(id, parsed.data);
  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Incident',
    entityId: id,
    after: parsed.data,
  });
  revalidatePath(`/admin/incidents/${id}`);
  revalidatePath('/admin/incidents');
}
