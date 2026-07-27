import { z } from 'zod';

export const addPartialPaymentSchema = z.object({
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  method: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

export type AddPartialPaymentInput = z.infer<typeof addPartialPaymentSchema>;
