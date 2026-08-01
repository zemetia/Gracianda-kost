/**
 * Labels for tenant/occupant identity fields. Lives in `lib` so the contract
 * form, the tenant pages and the contract detail page all read the same
 * Indonesian wording instead of each keeping a private map.
 */

export type Gender = 'LAKI_LAKI' | 'PEREMPUAN';
export type MaritalStatus = 'BELUM_MENIKAH' | 'MENIKAH' | 'CERAI';

// Mutable arrays, not `as const` — they are passed straight to `<Select
// options={...}>`, which takes a plain array.
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'LAKI_LAKI', label: 'Laki-laki' },
  { value: 'PEREMPUAN', label: 'Perempuan' },
];

export const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'BELUM_MENIKAH', label: 'Belum menikah' },
  { value: 'MENIKAH', label: 'Menikah' },
  { value: 'CERAI', label: 'Cerai' },
];

export function genderLabel(gender: string | null | undefined): string {
  return GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? '—';
}

export function maritalStatusLabel(status: string | null | undefined): string {
  return MARITAL_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? '—';
}

/**
 * Which gender a property's putra/putri rule expects. `CAMPUR` returns null —
 * no rule to check against, which is not the same as "no answer".
 */
export function genderRequiredBy(policy: string): Gender | null {
  if (policy === 'PUTRA') return 'LAKI_LAKI';
  if (policy === 'PUTRI') return 'PEREMPUAN';
  return null;
}

export const GENDER_POLICY_LABEL: Record<string, string> = {
  PUTRA: 'khusus putra',
  PUTRI: 'khusus putri',
  CAMPUR: 'campur',
};

/** Human count of everyone sleeping in the room: the tenant plus occupants. */
export function occupantCountLabel(extraOccupants: number): string {
  return `${extraOccupants + 1} orang`;
}
