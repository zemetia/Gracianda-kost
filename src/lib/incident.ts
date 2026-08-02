/**
 * Labels for incident enums. Lives in `lib` so the list, detail and form pages
 * read the same Indonesian wording instead of each keeping a private map.
 */

export type IncidentCategory =
  | 'PELANGGARAN_ATURAN'
  | 'GANGGUAN'
  | 'KERUSAKAN'
  | 'KEHILANGAN'
  | 'KELUHAN_PENGHUNI'
  | 'LAPORAN_SECURITY';

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type IncidentPersonRole = 'PELAPOR' | 'TERLIBAT' | 'SAKSI' | 'TERDAMPAK';

// Mutable arrays, not `as const` — passed straight to `<Select options={...}>`.
export const INCIDENT_CATEGORY_OPTIONS: { value: IncidentCategory; label: string }[] = [
  { value: 'PELANGGARAN_ATURAN', label: 'Pelanggaran Aturan' },
  { value: 'GANGGUAN', label: 'Gangguan' },
  { value: 'KERUSAKAN', label: 'Kerusakan' },
  { value: 'KEHILANGAN', label: 'Kehilangan' },
  { value: 'KELUHAN_PENGHUNI', label: 'Keluhan Penghuni' },
  { value: 'LAPORAN_SECURITY', label: 'Laporan Security' },
];

export const INCIDENT_STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
];

export const INCIDENT_PERSON_ROLE_OPTIONS: { value: IncidentPersonRole; label: string }[] = [
  { value: 'TERLIBAT', label: 'Terlibat' },
  { value: 'PELAPOR', label: 'Pelapor' },
  { value: 'SAKSI', label: 'Saksi' },
  { value: 'TERDAMPAK', label: 'Terdampak' },
];

export function incidentCategoryLabel(category: string | null | undefined): string {
  return INCIDENT_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? '—';
}

export function incidentStatusLabel(status: string | null | undefined): string {
  return INCIDENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? '—';
}

export function incidentPersonRoleLabel(role: string | null | undefined): string {
  return INCIDENT_PERSON_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? '—';
}

export const INCIDENT_STATUS_VARIANT: Record<string, 'destructive' | 'warning' | 'success'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

/**
 * Where the incident happened, in one line: room if it is tied to a unit,
 * otherwise the free-text spot, otherwise the property as a whole.
 */
export function incidentPlaceLabel(incident: {
  room: { number: string; floor: { name: string } | null } | null;
  location: string | null;
}): string {
  if (incident.room) {
    return `Unit ${incident.room.number}${incident.room.floor ? ` (${incident.room.floor.name})` : ''}`;
  }
  return incident.location ?? 'Seluruh Properti';
}

/**
 * The person picker submits one opaque ref per row so a single `<Combobox>`
 * can offer tenants and extra occupants side by side; these two helpers are the
 * only place that format is known.
 */
export function personRef(kind: 'tenant' | 'occupant', id: string): string {
  return `${kind}:${id}`;
}

export function parsePersonRef(
  ref: string | null | undefined,
): { tenantId: string | null; occupantId: string | null } {
  if (ref?.startsWith('tenant:')) return { tenantId: ref.slice(7), occupantId: null };
  if (ref?.startsWith('occupant:')) return { tenantId: null, occupantId: ref.slice(9) };
  return { tenantId: null, occupantId: null };
}
