import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string().min(1, 'Nama properti wajib diisi').max(150),
  code: z.string().min(2, 'Kode properti minimal 2 karakter').max(10).toUpperCase(),
  address: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(['KOST', 'HOUSE', 'APARTMENT', 'VILLA', 'OTHER']).default('KOST'),
  isActive: z.coerce.boolean().default(true),
});

export const floorSchema = z.object({
  name: z.string().min(1, 'Nama lantai wajib diisi').max(100),
  order: z.coerce.number().int().min(0),
  propertyId: z.string().min(1, 'Properti wajib dipilih'),
});

export const roomSchema = z.object({
  number: z.string().min(1, 'Nomor kamar wajib diisi').max(20),
  propertyId: z.string().min(1, 'Properti wajib dipilih'),
  floorId: z.string().optional().nullable(),
  price: z.coerce.number().positive('Harga harus lebih dari 0'),
  sizeSqm: z.coerce.number().positive().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  facilityIds: z.array(z.string()).default([]),
  priceDaily: z.coerce.number().positive().optional().nullable().or(z.literal(0)),
  priceWeekly: z.coerce.number().positive().optional().nullable().or(z.literal(0)),
  priceQuarterly: z.coerce.number().positive().optional().nullable().or(z.literal(0)),
  priceSemiAnnual: z.coerce.number().positive().optional().nullable().or(z.literal(0)),
  priceYearly: z.coerce.number().positive().optional().nullable().or(z.literal(0)),
});

export const facilitySchema = z.object({
  name: z.string().min(1, 'Nama fasilitas wajib diisi').max(100),
  icon: z.string().max(50).optional(),
  category: z.enum(['COMMON', 'ROOM']).default('ROOM'),
});

export const promoSchema = z
  .object({
    title: z.string().min(1, 'Judul promo wajib diisi').max(150),
    description: z.string().max(2000).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.coerce.boolean().default(true),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['endDate'],
  });

export type PropertyInput = z.infer<typeof propertySchema>;
export type FloorInput = z.infer<typeof floorSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type FacilityInput = z.infer<typeof facilitySchema>;
export type PromoInput = z.infer<typeof promoSchema>;
