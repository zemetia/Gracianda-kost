import { z } from 'zod';

export const tenantSchema = z.object({
  fullName: z.string().min(1, 'Nama wajib diisi').max(150),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  phone: z.string().min(8, 'Nomor HP wajib diisi').max(20),
  ktpNumber: z.string().min(1, 'Nomor KTP wajib diisi').max(30),
  occupation: z.string().max(100).optional(),
  vehicleType: z.string().max(100).optional(),
  vehiclePlate: z.string().max(20).optional(),
});

export const occupantSchema = z.object({
  fullName: z.string().min(1).max(150),
  relation: z.string().max(50).optional(),
});

export const newContractSchema = z.object({
  // Existing tenant reuse vs new tenant creation is decided by whether
  // tenantId is present — the Server Action branches on this.
  tenantId: z.string().optional(),
  tenant: tenantSchema.optional(),

  roomId: z.string().min(1, 'Kamar wajib dipilih'),
  rentPrice: z.coerce.number().positive('Harga sewa harus lebih dari 0'),
  deposit: z.coerce.number().min(0).optional(),
  billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  billingInterval: z.coerce.number().int().min(1).default(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  occupants: z.array(occupantSchema).default([]),
});

// The term of a follow-on contract — shared by "Perpanjang" and "Pindah Kamar",
// which differ only in whether the room changes.
const contractTermSchema = z.object({
  rentPrice: z.coerce.number().positive('Harga sewa harus lebih dari 0'),
  deposit: z.coerce.number().min(0).optional(),
  billingCycle: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  billingInterval: z.coerce.number().int().min(1).default(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

export const renewContractSchema = contractTermSchema;

export const transferRoomSchema = contractTermSchema.extend({
  roomId: z.string().min(1, 'Kamar tujuan wajib dipilih'),
});

// depositRefunded is deliberately absent — it is derived from deposit minus
// deduction in the service, so the two numbers can never contradict each other.
export const checkoutContractSchema = z.object({
  actualEndDate: z.coerce.date(),
  depositDeduction: z.coerce.number().min(0).optional(),
  depositNote: z.string().max(500).optional(),
  damageNote: z.string().max(500).optional(),
  damageCost: z.coerce.number().min(0).optional(),
});

export const blacklistSchema = z.object({
  isBlacklisted: z.coerce.boolean(),
  blacklistNote: z.string().max(500).optional(),
});

export type TenantInput = z.infer<typeof tenantSchema>;
export type OccupantInput = z.infer<typeof occupantSchema>;
export type NewContractInput = z.infer<typeof newContractSchema>;
export type RenewContractInput = z.infer<typeof renewContractSchema>;
export type TransferRoomInput = z.infer<typeof transferRoomSchema>;
export type CheckoutContractInput = z.infer<typeof checkoutContractSchema>;
export type BlacklistInput = z.infer<typeof blacklistSchema>;
