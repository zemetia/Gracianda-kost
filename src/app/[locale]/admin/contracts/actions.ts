'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';

import { requireRole } from '@/lib/auth';
import {
  checkoutContractSchema,
  newContractSchema,
  renewContractSchema,
  tenantSchema,
  transferRoomSchema,
} from '@/lib/validations';
import { contractService } from '@/services/contract.service';
import { attachmentService } from '@/services/attachment.service';
import { auditService } from '@/services/audit.service';

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export interface ContractFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const OCCUPANT_FIELDS = [
  'fullName',
  'relation',
  'gender',
  'phone',
  'ktpNumber',
  'occupation',
  'notes',
] as const;

/**
 * The occupant rows submit one value per field name, in row order — every row
 * renders every input (Select writes a hidden input even when empty), so the
 * lists line up and can be zipped back into objects. Rows left without a name
 * are dropped rather than rejected: an admin who clicked "Tambah Penghuni" once
 * too often should not get a validation error.
 */
function parseOccupants(formData: FormData) {
  const columns = Object.fromEntries(
    OCCUPANT_FIELDS.map((field) => [
      field,
      formData.getAll(`occupant${field[0]?.toUpperCase()}${field.slice(1)}`).map(String),
    ]),
  ) as Record<(typeof OCCUPANT_FIELDS)[number], string[]>;

  return (columns.fullName ?? [])
    .map((_, index) =>
      Object.fromEntries(OCCUPANT_FIELDS.map((field) => [field, columns[field][index] ?? ''])),
    )
    .filter((occupant) => String(occupant.fullName).trim());
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
  redirect({ href: `/admin/contracts/${contract.id}?created=1`, locale });
  return {};
}

/** Shared reader for the "Perpanjang" / "Pindah Kamar" term fields. */
function readTermFields(formData: FormData) {
  return {
    rentPrice: formData.get('rentPrice'),
    deposit: formData.get('deposit') || undefined,
    billingCycle: formData.get('billingCycle') || undefined,
    billingInterval: formData.get('billingInterval') || undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') || undefined,
    notes: formData.get('notes') || undefined,
  };
}

export async function renewContractAction(
  id: string,
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const session = await requireRole(CAN_MANAGE);

  const parsed = renewContractSchema.safeParse(readTermFields(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  let contract;
  try {
    contract = await contractService.renew(id, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal memperpanjang kontrak' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Contract',
    entityId: contract.id,
    before: { previousContractId: id },
    after: { contractCode: contract.contractCode, reason: 'RENEWAL' },
  });

  revalidatePath('/admin/contracts');
  revalidatePath(`/admin/contracts/${id}`);
  revalidatePath('/admin/payments');
  const locale = await getLocale();
  redirect({ href: `/admin/contracts/${contract.id}`, locale });
  return {};
}

export async function transferRoomAction(
  id: string,
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const session = await requireRole(CAN_MANAGE);

  const parsed = transferRoomSchema.safeParse({
    ...readTermFields(formData),
    roomId: formData.get('roomId'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  let contract;
  try {
    contract = await contractService.transferRoom(id, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal memindahkan kamar' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'CREATE',
    entityType: 'Contract',
    entityId: contract.id,
    before: { previousContractId: id },
    after: { contractCode: contract.contractCode, roomId: contract.roomId, reason: 'TRANSFER' },
  });

  revalidatePath('/admin/contracts');
  revalidatePath(`/admin/contracts/${id}`);
  revalidatePath('/admin/master-data/rooms');
  const locale = await getLocale();
  redirect({ href: `/admin/contracts/${contract.id}`, locale });
  return {};
}

export async function checkoutContractAction(
  id: string,
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const session = await requireRole(CAN_MANAGE);

  const parsed = checkoutContractSchema.safeParse({
    actualEndDate: formData.get('actualEndDate'),
    depositDeduction: formData.get('depositDeduction') || undefined,
    depositNote: formData.get('depositNote') || undefined,
    damageNote: formData.get('damageNote') || undefined,
    damageCost: formData.get('damageCost') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  let contract;
  try {
    contract = await contractService.checkout(id, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal memproses check-out' };
  }

  await auditService.log({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Contract',
    entityId: id,
    after: {
      status: 'ENDED',
      endReason: 'CHECKOUT',
      actualEndDate: parsed.data.actualEndDate,
      depositRefunded: contract.depositRefunded?.toString(),
      depositDeduction: contract.depositDeduction?.toString(),
    },
  });

  revalidatePath('/admin/contracts');
  revalidatePath('/admin/master-data/rooms');
  revalidatePath('/admin/maintenance');
  const locale = await getLocale();
  redirect({ href: `/admin/contracts/${id}`, locale });
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
