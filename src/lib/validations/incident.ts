import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim() || null)
    .nullable()
    .optional();

export const incidentPersonSchema = z.object({
  role: z.enum(['PELAPOR', 'TERLIBAT', 'SAKSI', 'TERDAMPAK']).default('TERLIBAT'),
  tenantId: z.string().nullable().optional(),
  occupantId: z.string().nullable().optional(),
  name: z.string().min(1, 'Nama orang wajib diisi').max(150),
  phone: optionalText(30),
  notes: optionalText(500),
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
  propertyId: z.string().min(1, 'Properti wajib dipilih'),
  roomId: z.string().optional().nullable(),
  location: z.string().max(150).optional().nullable(),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(2000),
  people: z.array(incidentPersonSchema).default([]),
});

export const incidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
});

export type IncidentPersonInput = z.infer<typeof incidentPersonSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
export type IncidentStatusInput = z.infer<typeof incidentStatusSchema>;
