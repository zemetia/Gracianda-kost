'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { expenseSchema } from '@/lib/validations';
import { expenseService } from '@/services/expense.service';
import { attachmentService } from '@/services/attachment.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'KEUANGAN'];

export interface ExpenseFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseExpenseForm(formData: FormData) {
  return expenseSchema.safeParse({
    propertyId: formData.get('propertyId'),
    category: formData.get('category'),
    date: formData.get('date'),
    amount: formData.get('amount'),
    payee: formData.get('payee') || undefined,
    note: formData.get('note') || undefined,
  });
}

export async function createExpenseAction(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parseExpenseForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const expense = await expenseService.create({ ...parsed.data, createdByUserId: session.user.id });
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Expense',
      entityId: expense.id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan pengeluaran' };
  }

  revalidatePath('/admin/expenses');
  return {};
}

export async function updateExpenseAction(
  id: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = parseExpenseForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await expenseService.update(id, parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Expense',
      entityId: id,
      after: parsed.data,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan pengeluaran' };
  }

  revalidatePath('/admin/expenses');
  revalidatePath(`/admin/expenses/${id}`);
  return {};
}

export async function removeExpenseAction(id: string): Promise<{ error?: string }> {
  const session = await requireRole(CAN_MANAGE);

  let removed;
  try {
    removed = await expenseService.remove(id);
  } catch {
    return { error: 'Pengeluaran gagal dihapus' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'Expense',
    entityId: id,
    before: { category: removed.category, amount: removed.amount.toString(), date: removed.date },
  });
  revalidatePath('/admin/expenses');
  return {};
}

export async function uploadExpenseReceiptAction(expenseId: string, formData: FormData): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  const kind = file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO';
  const attachment = await attachmentService.upload({
    file,
    entityType: 'EXPENSE',
    entityId: expenseId,
    kind,
  });
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Attachment',
    entityId: attachment.id,
    after: { entityType: 'EXPENSE', entityId: expenseId, kind, url: attachment.url },
  });
  revalidatePath(`/admin/expenses/${expenseId}`);
}

export async function removeExpenseReceiptAction(expenseId: string, attachmentId: string): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const removed = await attachmentService.remove(attachmentId);
  await auditService.log({
    userId: session.user.id,
    action: 'DELETE',
    entityType: 'Attachment',
    entityId: attachmentId,
    before: { entityType: 'EXPENSE', entityId: expenseId, kind: removed.kind, url: removed.url },
  });
  revalidatePath(`/admin/expenses/${expenseId}`);
}
