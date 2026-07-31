import { z } from 'zod';

export const settingsSchema = z.object({
  // 0 is legal and meaningful: "tarif belum ditentukan", which makes every
  // metered charge come out as Rp 0 instead of a wrong number.
  electricityTariffPerKwh: z.coerce
    .number({ message: 'Tarif harus berupa angka' })
    .min(0, 'Tarif tidak boleh negatif')
    .max(100_000, 'Tarif per kWh terlalu besar'),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
