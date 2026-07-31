/**
 * Fixed expense categories — deliberately no "Maintenance" entry, repair
 * costs stay in MaintenanceRecord.cost so reportService.financial() never
 * double-counts. Lives in `lib` so forms and the report page share one label
 * source, same pattern as ELECTRICITY_MODES.
 */

export type ExpenseCategory =
  | 'RENOVATION'
  | 'CLEANING'
  | 'ELECTRICITY'
  | 'WATER'
  | 'WIFI_INTERNET'
  | 'STAFF_SALARY'
  | 'WASTE_MANAGEMENT'
  | 'TAX_LICENSING'
  | 'INSURANCE'
  | 'SUPPLIES'
  | 'MARKETING'
  | 'OTHER';

export const EXPENSE_CATEGORIES = [
  { value: 'RENOVATION', label: 'Renovasi' },
  { value: 'CLEANING', label: 'Kebersihan' },
  { value: 'ELECTRICITY', label: 'Listrik/PLN' },
  { value: 'WATER', label: 'Air/PDAM' },
  { value: 'WIFI_INTERNET', label: 'Internet/WiFi' },
  { value: 'STAFF_SALARY', label: 'Gaji Staf/ART' },
  { value: 'WASTE_MANAGEMENT', label: 'Sampah' },
  { value: 'TAX_LICENSING', label: 'Pajak & Perizinan' },
  { value: 'INSURANCE', label: 'Asuransi' },
  { value: 'SUPPLIES', label: 'Perlengkapan & Consumable' },
  { value: 'MARKETING', label: 'Pemasaran/Iklan' },
  { value: 'OTHER', label: 'Lainnya' },
] as const satisfies readonly { value: ExpenseCategory; label: string }[];

const CATEGORY_LABEL: Record<ExpenseCategory, string> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ExpenseCategory, string>;

export function expenseCategoryLabel(category: string): string {
  return CATEGORY_LABEL[category as ExpenseCategory] ?? category;
}
