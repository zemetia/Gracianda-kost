'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

import { requireRole } from '@/lib/auth';
import { closeContractSchema, newContractSchema, tenantSchema } from '@/lib/validations';
import { contractService } from '@/services/contract.service';
import { attachmentService } from '@/services/attachment.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface ContractFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseOccupants(formData: FormData) {
  const raw = String(formData.get('occupantNames') ?? '');
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((fullName) => ({ fullName }));
}

export async function createContractAction(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const session = await requireRole(CAN_MANAGE);

  const mode = formData.get('tenantMode');
  const tenantId = mode === 'existing' ? String(formData.get('tenantId') || '') : undefined;

  let tenant;
  if (mode === 'new') {
    const tenantParsed = tenantSchema.safeParse({
      fullName: formData.get('fullName'),
      email: formData.get('email') || undefined,
      phone: formData.get('phone'),
      ktpNumber: formData.get('ktpNumber'),
      occupation: formData.get('occupation') || undefined,
      vehicleType: formData.get('vehicleType') || undefined,
      vehiclePlate: formData.get('vehiclePlate') || undefined,
    });
    if (!tenantParsed.success) return { fieldErrors: tenantParsed.error.flatten().fieldErrors };
    tenant = tenantParsed.data;
  }

  const parsed = newContractSchema.safeParse({
    tenantId,
    tenant,
    roomId: formData.get('roomId'),
    rentPrice: formData.get('rentPrice'),
    deposit: formData.get('deposit') || undefined,
    billingCycle: formData.get('billingCycle') || undefined,
    billingInterval: formData.get('billingInterval') || undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') || undefined,
    notes: formData.get('notes') || undefined,
    occupants: parseOccupants(formData),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  let contract;
  try {
    contract = await contractService.create(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal membuat kontrak' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Contract',
    entityId: contract.id,
    after: { contractCode: contract.contractCode, roomId: contract.roomId, tenantId: contract.tenantId },
  });

  revalidatePath('/admin/master-data/rooms');
  revalidatePath('/admin/tenants');
  const locale = await getLocale();
  redirect({ href: `/admin/contracts/${contract.id}`, locale });
  return {};
}

export interface CloseContractFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function closeContractAction(
  id: string,
  _prevState: CloseContractFormState,
  formData: FormData,
): Promise<CloseContractFormState> {
  const session = await requireRole(CAN_MANAGE);
  const parsed = closeContractSchema.safeParse({ actualEndDate: formData.get('actualEndDate') });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await contractService.close(id, parsed.data);
  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Contract',
    entityId: id,
    after: { status: 'ENDED', actualEndDate: parsed.data.actualEndDate },
  });

  revalidatePath('/admin/master-data/rooms');
  revalidatePath(`/admin/contracts/${id}`);
  return {};
}

export async function uploadContractDocAction(contractId: string, formData: FormData): Promise<void> {
  const session = await requireRole(CAN_MANAGE);
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;

  const attachment = await attachmentService.upload({
    file,
    entityType: 'CONTRACT',
    entityId: contractId,
    kind: 'DOCUMENT',
  });
  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Attachment',
    entityId: attachment.id,
    after: { entityType: 'CONTRACT', entityId: contractId, kind: 'DOCUMENT', url: attachment.url },
  });

  revalidatePath(`/admin/contracts/${contractId}`);
}
