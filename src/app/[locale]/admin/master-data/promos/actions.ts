'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { promoSchema } from '@/lib/validations';
import { promoService } from '@/services/promo.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface PromoFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createPromoAction(
  _prevState: PromoFormState,
  formData: FormData,
): Promise<PromoFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = promoSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const promo = await promoService.create(parsed.data);
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Promo',
    entityId: promo.id,
    after: parsed.data,
  });

  revalidatePath('/admin/master-data/promos');
  return {};
}

export async function removePromoAction(id: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const removed = await promoService.remove(id);
  await auditService.log({
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'Promo',
    entityId: id,
    before: { title: removed.title, startDate: removed.startDate, endDate: removed.endDate },
  });
  revalidatePath('/admin/master-data/promos');
}
