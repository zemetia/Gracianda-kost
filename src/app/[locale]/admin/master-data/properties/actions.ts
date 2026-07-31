'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { propertySchema } from '@/lib/validations';
import { propertyService } from '@/services/property.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface PropertyFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parsePropertyForm(formData: FormData) {
  return propertySchema.safeParse({
    name: formData.get('name'),
    code: formData.get('code'),
    type: formData.get('type'),
    address: formData.get('address') || undefined,
    description: formData.get('description') || undefined,
    isActive: formData.get('isActive') === 'on' || formData.get('isActive') === 'true',
    facilityIds: formData.getAll('facilityIds'),
  });
}

export async function createPropertyAction(
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parsePropertyForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const property = await propertyService.create(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Property',
      entityId: property.id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan properti' };
  }

  revalidatePath('/admin/master-data/properties');
  return {};
}

export async function updatePropertyAction(
  id: string,
  _prevState: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parsePropertyForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await propertyService.update(id, parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Property',
      entityId: id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan properti' };
  }

  revalidatePath('/admin/master-data/properties');
  revalidatePath(`/admin/master-data/properties/${id}`);
  return {};
}

export async function deactivatePropertyAction(id: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  await propertyService.deactivate(id);
  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Property',
    entityId: id,
    after: { isActive: false },
  });
  revalidatePath('/admin/master-data/properties');
}
