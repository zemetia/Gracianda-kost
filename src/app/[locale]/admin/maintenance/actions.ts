'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { maintenanceSchema } from '@/lib/validations';
import { maintenanceService } from '@/services/maintenance.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface MaintenanceFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createMaintenanceAction(
  _prevState: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = maintenanceSchema.safeParse({
    scope: formData.get('scope'),
    roomId: formData.get('roomId') || undefined,
    category: formData.get('category'),
    date: formData.get('date'),
    cost: formData.get('cost') || undefined,
    vendor: formData.get('vendor') || undefined,
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const record = await maintenanceService.create(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'MaintenanceRecord',
      entityId: record.id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan data maintenance' };
  }

  revalidatePath('/admin/maintenance');
  return {};
}
