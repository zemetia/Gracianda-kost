/**
 * Pure electricity-billing rules. Lives in `lib` (not the service) so the
 * payment service, the admin forms and the unit tests share one implementation.
 */

export type ElectricityMode = 'FREE' | 'TOKEN' | 'METERED';

export const ELECTRICITY_MODES = [
  {
    value: 'FREE',
    label: 'Gratis',
    hint: 'Listrik sudah termasuk harga sewa — tidak pernah ditagih terpisah.',
  },
  {
    value: 'TOKEN',
    label: 'Token',
    hint: 'Prabayar. Penyewa membeli token sendiri, kost tidak menagih apa pun.',
  },
  {
    value: 'METERED',
    label: 'Bayar (non-token)',
    hint: 'Pascabayar. Admin mencatat pemakaian kWh tiap periode, ditagih kWh × tarif.',
  },
] as const satisfies readonly { value: ElectricityMode; label: string; hint: string }[];

const MODE_LABEL: Record<ElectricityMode, string> = {
  FREE: 'Gratis',
  TOKEN: 'Token',
  METERED: 'Bayar (non-token)',
};

export function electricityModeLabel(mode: string): string {
  return MODE_LABEL[mode as ElectricityMode] ?? mode;
}

/** Only METERED units are ever billed for electricity on an invoice. */
export function isMetered(mode: string): boolean {
  return mode === 'METERED';
}

/**
 * Rupiah owed for a meter reading. Rounded to whole rupiah here — the invoice
 * total is money, and a stored half-rupiah would never reconcile with cash.
 */
export function electricityCharge(kwh: number, tariffPerKwh: number): number {
  if (kwh <= 0 || tariffPerKwh <= 0) return 0;
  return Math.round(kwh * tariffPerKwh);
}
