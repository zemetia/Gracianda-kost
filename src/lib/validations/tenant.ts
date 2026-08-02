import { z } from 'zod';

import { BLACKLIST_REASONS } from '@/lib/blacklist';

// Optional free text that an empty input must be able to CLEAR — `''` and
// `undefined` both become null so an update writes null instead of silently
// keeping the previous value.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

// Same idea for enums and dates: an empty `<select>` / date field means
// "kosongkan", not "biarkan".
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .enum(values)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((value) => (value ? (value as T[number]) : null));

const optionalDate = z
  .union([z.coerce.date(), z.literal('')])
  .optional()
  .nullable()
  .transform((value) => (value instanceof Date ? value : null));

export const GENDERS = ['LAKI_LAKI', 'PEREMPUAN'] as const;
export const MARITAL_STATUSES = ['BELUM_MENIKAH', 'MENIKAH', 'CERAI'] as const;

export const tenantSchema = z.object({
  fullName: z.string().min(1, 'Nama wajib diisi').max(150),
  email: optionalText(150).refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Email tidak valid',
  }),
  phone: z.string().min(8, 'Nomor HP wajib diisi').max(20),
  ktpNumber: z.string().min(1, 'Nomor KTP wajib diisi').max(30),

  gender: optionalEnum(GENDERS),
  birthPlace: optionalText(100),
  birthDate: optionalDate,
  maritalStatus: optionalEnum(MARITAL_STATUSES),
  idAddress: optionalText(500),

  occupation: optionalText(100),
  institution: optionalText(150),
  vehicleType: optionalText(100),
  vehiclePlate: optionalText(20),

  emergencyName: optionalText(150),
  emergencyRelation: optionalText(50),
  emergencyPhone: optionalText(20),
});

// One extra person living in the room. Only the name is required — an occupant
// whose details the admin does not have yet is still better recorded than not
// recorded at all.
export const occupantSchema = z.object({
  fullName: z.string().trim().min(1).max(150),
  relation: optionalText(50),
  gender: optionalEnum(GENDERS),
  phone: optionalText(20),
  ktpNumber: optionalText(30),
  occupation: optionalText(100),
  notes: optionalText(300),
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

// Masuk daftar hitam wajib beralasan: kategori supaya beratnya terbaca sekali
// lihat di daftar, kronologi supaya bisa dipertanggungjawabkan saat orangnya
// membantah. Mengeluarkan dari daftar tidak menuntut apa-apa — makanya
// pemeriksaannya `superRefine`, bukan field wajib.
export const blacklistSchema = z
  .object({
    isBlacklisted: z.coerce.boolean(),
    blacklistReason: optionalEnum(BLACKLIST_REASONS),
    // Clearing the textarea must actually erase the reason — `undefined` would
    // leave the old note attached to a tenant nobody flagged anymore.
    blacklistNote: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    if (!value.isBlacklisted) return;
    if (!value.blacklistReason) {
      ctx.addIssue({ code: 'custom', path: ['blacklistReason'], message: 'Kategori wajib dipilih' });
    }
    if (!value.blacklistNote) {
      ctx.addIssue({
        code: 'custom',
        path: ['blacklistNote'],
        message: 'Kronologi wajib diisi — daftar hitam tanpa alasan tidak bisa dipertanggungjawabkan',
      });
    }
  });

export type TenantInput = z.infer<typeof tenantSchema>;
export type OccupantInput = z.infer<typeof occupantSchema>;
export type NewContractInput = z.infer<typeof newContractSchema>;
export type RenewContractInput = z.infer<typeof renewContractSchema>;
export type TransferRoomInput = z.infer<typeof transferRoomSchema>;
export type CheckoutContractInput = z.infer<typeof checkoutContractSchema>;
export type BlacklistInput = z.infer<typeof blacklistSchema>;
