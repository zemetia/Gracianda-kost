'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { facilitySchema } from '@/lib/validations';
import { facilityService } from '@/services/facility.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface FacilityFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createFacilityAction(
  _prevState: FacilityFormState,
  formData: FormData,
): Promise<FacilityFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = facilitySchema.safeParse({
    name: formData.get('name'),
    icon: formData.get('icon') || undefined,
    category: formData.get('category') ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const facility = await facilityService.create(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Facility',
      entityId: facility.id,
      after: parsed.data,
    });
  } catch {
    return { error: 'Fasilitas dengan nama itu sudah ada' };
  }

  revalidatePath('/admin/master-data/facilities');
  return {};
}

export async function removeFacilityAction(id: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const removed = await facilityService.remove(id);
  await auditService.log({
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'Facility',
    entityId: id,
    before: { name: removed.name, icon: removed.icon },
  });
  revalidatePath('/admin/master-data/facilities');
}
