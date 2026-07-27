'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { createUserSchema, setUserActiveSchema, updateUserSchema } from '@/lib/validations';
import { userService } from '@/services/user.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN'];

export interface UserFormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const user = await userService.create(parsed.data);
    // Password never enters the audit trail.
    await auditService.log({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      after: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal membuat user' };
  }

  revalidatePath('/admin/users');
  return { success: 'User berhasil dibuat' };
}

export async function updateUserAction(
  id: string,
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireRole(CAN_MANAGE);
  const password = String(formData.get('password') ?? '');
  const parsed = updateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: password || undefined,
    role: formData.get('role'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Locking yourself out of SUPER_ADMIN is a one-way door — block it here rather
  // than relying on the last-super-admin check (another one may still exist).
  if (id === session.user.id && parsed.data.role !== 'SUPER_ADMIN') {
    return { error: 'Tidak bisa menurunkan role akun sendiri' };
  }

  try {
    const before = await userService.getById(id);
    const user = await userService.update(id, parsed.data);
    await auditService.log({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      before: before ? { name: before.name, email: before.email, role: before.role } : undefined,
      after: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordChanged: Boolean(parsed.data.password),
      },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan user' };
  }

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  return { success: 'Perubahan tersimpan' };
}

export async function setUserActiveAction(
  id: string,
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireRole(CAN_MANAGE);
  if (id === session.user.id) return { error: 'Tidak bisa menonaktifkan akun sendiri' };

  const parsed = setUserActiveSchema.safeParse({ isActive: formData.get('isActive') === 'true' });
  if (!parsed.success) return { error: 'Input tidak valid' };

  try {
    await userService.setActive(id, parsed.data.isActive);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal mengubah status user' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'User',
    entityId: id,
    after: { isActive: parsed.data.isActive },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}`);
  return { success: parsed.data.isActive ? 'User diaktifkan' : 'User dinonaktifkan' };
}
