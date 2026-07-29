'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth, requireRole } from '@/lib/auth';
import { addPartialPaymentSchema } from '@/lib/validations';
import { paymentService } from '@/services/payment.service';
import { auditService } from '@/services/audit.service';
import { attachmentService } from '@/services/attachment.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'KEUANGAN'];

export async function generateInvoicesAction(): Promise<{ created: number } | { error: string }> {
  const session = await requireRole(CAN_MANAGE);

  const now = new Date();
  const periodMonth = now.getMonth() + 1;
  const periodYear = now.getFullYear();

  const result = await paymentService.generateMonthlyInvoices(periodMonth, periodYear);

  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Payment',
    entityId: `${periodYear}-${String(periodMonth).padStart(2, '0')}`,
    after: { periodMonth, periodYear, created: result.created },
  });

  revalidatePath('/admin/payments');
  return result;
}

/**
 * Records that a reminder was opened. Any logged-in admin may do this — it is
 * a note that the tenant was contacted, not a change to the money.
 */
export async function logReminderAction(paymentId: string): Promise<void> {
  const session = await requireAuth();
  await paymentService.logReminder(paymentId, session.user.id);

  revalidatePath('/admin/payments');
  revalidatePath(`/admin/payments/${paymentId}`);
}

export async function markAsPaidAction(id: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  await paymentService.markAsPaid(id);

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Payment',
    entityId: id,
    after: { paidAt: new Date() },
  });

  revalidatePath('/admin/payments');
  revalidatePath(`/admin/payments/${id}`);
}

export interface AddPaymentFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function addPartialPaymentAction(
  id: string,
  _prevState: AddPaymentFormState,
  formData: FormData,
): Promise<AddPaymentFormState> {
  const session = await requireRole(CAN_MANAGE);

  const parsed = addPartialPaymentSchema.safeParse({
    amount: formData.get('amount'),
    method: formData.get('method') || undefined,
    note: formData.get('note') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const payment = await paymentService.addPartialPayment(id, parsed.data);

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Payment',
    entityId: id,
    after: { amountPaid: payment.amountPaid.toString(), method: parsed.data.method },
  });

  revalidatePath('/admin/payments');
  revalidatePath(`/admin/payments/${id}`);
  return {};
}

export async function uploadPaymentProofAction(paymentId: string, formData: FormData): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  const attachment = await attachmentService.upload({
    file,
    entityType: 'PAYMENT',
    entityId: paymentId,
    kind: 'PHOTO',
  });
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Attachment',
    entityId: attachment.id,
    after: { entityType: 'PAYMENT', entityId: paymentId, kind: 'PHOTO', url: attachment.url },
  });

  revalidatePath(`/admin/payments/${paymentId}`);
}
