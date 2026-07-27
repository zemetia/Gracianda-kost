import { z } from 'zod';

export const floorSchema = z.object({
  name: z.string().min(1, 'Nama lantai wajib diisi').max(100),
  order: z.coerce.number().int().min(0),
});

export const roomSchema = z.object({
  number: z.string().min(1, 'Nomor kamar wajib diisi').max(20),
  floorId: z.string().min(1, 'Lantai wajib dipilih'),
  price: z.coerce.number().positive('Harga harus lebih dari 0'),
  sizeSqm: z.coerce.number().positive().optional(),
  description: z.string().max(2000).optional(),
  isActive: z.coerce.boolean().default(true),
  facilityIds: z.array(z.string()).default([]),
});

export const facilitySchema = z.object({
  name: z.string().min(1, 'Nama fasilitas wajib diisi').max(100),
  icon: z.string().max(50).optional(),
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

export type FloorInput = z.infer<typeof floorSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type FacilityInput = z.infer<typeof facilitySchema>;
export type PromoInput = z.infer<typeof promoSchema>;
