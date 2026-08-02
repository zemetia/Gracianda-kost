import { z } from 'zod';

export const maintenanceSchema = z
  .object({
    scope: z.enum(['ROOM', 'BUILDING']),
    propertyId: z.string().min(1, 'Properti wajib dipilih'),
    roomId: z.string().optional().nullable(),
    category: z.string().min(1, 'Kategori wajib diisi').max(100),
    date: z.coerce.date(),
    cost: z.coerce.number().min(0).optional().nullable(),
    vendor: z.string().max(150).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine((data) => data.scope !== 'ROOM' || !!data.roomId, {
    message: 'Kamar wajib dipilih untuk scope kamar',
    path: ['roomId'],
  });

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
