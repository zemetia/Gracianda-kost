'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';

import { redirect } from '@/i18n/navigation';
import { requireRole } from '@/lib/auth';
import { blacklistSchema, tenantSchema } from '@/lib/validations';
import { tenantService } from '@/services/tenant.service';
import { attachmentService } from '@/services/attachment.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface BlacklistFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function revalidateBlacklist(tenantId: string) {
  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath('/admin/tenants');
  revalidatePath('/admin/tenants/blacklist');
}

/**
 * Satu aksi untuk memasukkan dan menyunting entri daftar hitam — form-nya
 * memang satu (`BlacklistDialog`), jadi validasinya juga harus satu.
 * `tenantId` datang dari form supaya dialog "Tambah" bisa memilih penyewanya
 * sendiri lewat Combobox.
 */
export async function setBlacklistAction(
  _prevState: BlacklistFormState,
  formData: FormData,
): Promise<BlacklistFormState> {
  const session = await requireRole(CAN_MANAGE);

  const tenantId = String(formData.get('tenantId') ?? '');
  if (!tenantId) return { fieldErrors: { tenantId: ['Penyewa wajib dipilih'] } };

  const parsed = blacklistSchema.safeParse({
    isBlacklisted: true,
    blacklistReason: formData.get('blacklistReason'),
    blacklistNote: formData.get('blacklistNote'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await tenantService.setBlacklist(tenantId, parsed.data, session.user.id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan entri blacklist' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Tenant',
    entityId: tenantId,
    after: parsed.data,
  });

  revalidateBlacklist(tenantId);
  return {};
}

/**
 * Mengeluarkan dari daftar hitam menghapus kategori dan kronologinya juga —
 * jejaknya tetap terbaca di Audit Log, yang memang tempatnya, bukan di kolom
 * penyewa yang statusnya sudah bersih.
 */
export async function removeFromBlacklistAction(tenantId: string): Promise<{ error?: string }> {
  const session = await requireRole(CAN_MANAGE);

  try {
    await tenantService.setBlacklist(
      tenantId,
      { isBlacklisted: false, blacklistReason: null, blacklistNote: null },
      session.user.id,
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal mengeluarkan dari blacklist' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Tenant',
    entityId: tenantId,
    after: { isBlacklisted: false },
  });

  revalidateBlacklist(tenantId);
  return {};
}

export interface TenantFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Identitas penyewa disunting di halamannya sendiri, bukan lewat kontrak:
 * satu orang bisa punya banyak kontrak, jadi memperbaiki nomor HP di salah
 * satunya akan membuat data yang sama berbeda-beda per kontrak.
 */
export async function updateTenantAction(
  id: string,
  _prevState: TenantFormState,
  formData: FormData,
): Promise<TenantFormState> {
  const session = await requireRole(CAN_MANAGE);

  const parsed = tenantSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    ktpNumber: formData.get('ktpNumber'),
    gender: formData.get('gender'),
    birthPlace: formData.get('birthPlace'),
    birthDate: formData.get('birthDate'),
    maritalStatus: formData.get('maritalStatus'),
    idAddress: formData.get('idAddress'),
    occupation: formData.get('occupation'),
    institution: formData.get('institution'),
    vehicleType: formData.get('vehicleType'),
    vehiclePlate: formData.get('vehiclePlate'),
    emergencyName: formData.get('emergencyName'),
    emergencyRelation: formData.get('emergencyRelation'),
    emergencyPhone: formData.get('emergencyPhone'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await tenantService.update(id, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan data penyewa' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Tenant',
    entityId: id,
    after: parsed.data,
  });

  revalidatePath('/admin/tenants');
  revalidatePath(`/admin/tenants/${id}`);
  const locale = await getLocale();
  redirect({ href: `/admin/tenants/${id}`, locale });
  return {};
}

export async function uploadKtpAction(tenantId: string, formData: FormData): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  const attachment = await attachmentService.upload({
    file,
    entityType: 'TENANT',
    entityId: tenantId,
    kind: 'DOCUMENT',
    label: 'Scan KTP',
  });
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Attachment',
    entityId: attachment.id,
    after: { entityType: 'TENANT', entityId: tenantId, kind: 'DOCUMENT', url: attachment.url },
  });

  revalidatePath(`/admin/tenants/${tenantId}`);
}
