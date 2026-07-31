'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { settingsSchema } from '@/lib/validations';
import { auditService } from '@/services/audit.service';
import { settingService } from '@/services/setting.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'KEUANGAN'];

export interface SettingsFormState {
  error?: string;
  saved?: boolean;
  fieldErrors?: Record<string, string[]>;
}

export async function saveSettingsAction(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requireRole(CAN_MANAGE);

  const parsed = settingsSchema.safeParse({
    electricityTariffPerKwh: formData.get('electricityTariffPerKwh'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await settingService.save(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Setting',
      entityId: 'app',
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan' };
  }

  revalidatePath('/admin/settings');
  return { saved: true };
}
