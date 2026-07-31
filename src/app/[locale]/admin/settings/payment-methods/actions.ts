'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { paymentMethodSchema } from '@/lib/validations';
import { paymentMethodService } from '@/services/payment-method.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'KEUANGAN'];

export interface PaymentMethodFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createPaymentMethodAction(
  _prevState: PaymentMethodFormState,
  formData: FormData,
): Promise<PaymentMethodFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = paymentMethodSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const method = await paymentMethodService.create(parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'PaymentMethod',
      entityId: method.id,
      after: parsed.data,
    });
  } catch {
    return { error: 'Metode pembayaran dengan nama itu sudah ada' };
  }

  revalidatePath('/admin/settings/payment-methods');
  return {};
}

export async function deactivatePaymentMethodAction(id: string): Promise<{ error?: string }> {
  const session = await requireRole(CAN_MANAGE);

  let deactivated;
  try {
    deactivated = await paymentMethodService.deactivate(id);
  } catch {
    return { error: 'Metode pembayaran gagal dinonaktifkan' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'PaymentMethod',
    entityId: id,
    after: { isActive: false, name: deactivated.name },
  });
  revalidatePath('/admin/settings/payment-methods');
  return {};
}
