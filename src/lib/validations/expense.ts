import { z } from 'zod';

export const expenseSchema = z.object({
  propertyId: z.string().min(1, 'Properti wajib dipilih'),
  category: z.enum([
    'RENOVATION',
    'CLEANING',
    'ELECTRICITY',
    'WATER',
    'WIFI_INTERNET',
    'STAFF_SALARY',
    'WASTE_MANAGEMENT',
    'TAX_LICENSING',
    'INSURANCE',
    'SUPPLIES',
    'MARKETING',
    'OTHER',
  ]),
  date: z.coerce.date(),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  payee: z.string().max(150).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
