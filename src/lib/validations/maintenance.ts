import { z } from 'zod';

export const maintenanceSchema = z
  .object({
    scope: z.enum(['ROOM', 'BUILDING']),
    roomId: z.string().optional(),
    category: z.string().min(1, 'Kategori wajib diisi').max(100),
    date: z.coerce.date(),
    cost: z.coerce.number().min(0).optional(),
    vendor: z.string().max(150).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => data.scope !== 'ROOM' || !!data.roomId, {
    message: 'Kamar wajib dipilih untuk scope kamar',
    path: ['roomId'],
  });

export const incidentSchema = z.object({
  category: z.enum([
    'PELANGGARAN_ATURAN',
    'GANGGUAN',
    'KERUSAKAN',
    'KEHILANGAN',
    'KELUHAN_PENGHUNI',
    'LAPORAN_SECURITY',
  ]),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).default('OPEN'),
  date: z.coerce.date(),
  roomId: z.string().optional(),
  location: z.string().max(150).optional(),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(2000),
});

export const incidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
export type IncidentStatusInput = z.infer<typeof incidentStatusSchema>;
