import { z } from 'zod';

export const addPartialPaymentSchema = z.object({
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  paymentMethodId: z.string().min(1, 'Pilih metode pembayaran'),
  note: z.string().max(500).optional(),
});

export const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Nama metode wajib diisi').max(100),
  type: z.enum(['CASH', 'BANK', 'EWALLET']).default('CASH'),
});

// A meter reading, not money: the rupiah is derived from the tariff in
// Setting so the admin can never type a total that contradicts kWh × tarif.
export const recordElectricitySchema = z.object({
  kwh: z.coerce
    .number({ message: 'Pemakaian harus berupa angka' })
    .min(0, 'Pemakaian tidak boleh negatif')
    .max(100_000, 'Pemakaian kWh terlalu besar'),
});

export type AddPartialPaymentInput = z.infer<typeof addPartialPaymentSchema>;
export type RecordElectricityInput = z.infer<typeof recordElectricitySchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
