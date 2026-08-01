/**
 * Property-level vocabulary. Lives in `lib` so the admin master data pages and
 * the public catalog print the same Indonesian wording — a per-page map is a
 * map that drifts the moment a type is added.
 */

export type PropertyTypeName = 'KOST' | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'OTHER';

// Mutable array, not `as const` — it is passed straight to `<Select options>`.
export const PROPERTY_TYPE_OPTIONS: { value: PropertyTypeName; label: string }[] = [
  { value: 'KOST', label: 'Kost' },
  { value: 'HOUSE', label: 'Rumah' },
  { value: 'APARTMENT', label: 'Apartemen' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'OTHER', label: 'Lainnya' },
];

export function propertyTypeLabel(type: string | null | undefined): string {
  return PROPERTY_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Lainnya';
}
