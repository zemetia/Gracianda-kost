'use server';

import { revalidatePath } from 'next/cache';

import { requireRole } from '@/lib/auth';
import { blacklistSchema } from '@/lib/validations';
import { tenantService } from '@/services/tenant.service';
import { attachmentService } from '@/services/attachment.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export async function setBlacklistAction(tenantId: string, formData: FormData): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = blacklistSchema.safeParse({
    isBlacklisted: formData.get('isBlacklisted') === 'on',
    blacklistNote: formData.get('blacklistNote') || undefined,
  });
  if (!parsed.success) return;

  await tenantService.setBlacklist(tenantId, parsed.data);
  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Tenant',
    entityId: tenantId,
    after: parsed.data,
  });

  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath('/admin/tenants');
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
