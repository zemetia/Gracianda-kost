/**
 * Two lifecycles for master data (Property / Room / RoomType), deliberately
 * kept apart:
 *
 *   Nonaktif (`isActive = false`) — parked. Invisible to the public site and
 *   to new contracts, but the admin can still find it behind the "Nonaktif"
 *   filter and switch it back on. It is never mixed into the active list:
 *   one bucket at a time, so a list of 40 rooms is 40 rooms you can rent out.
 *
 *   Terhapus (`deletedAt != null`) — gone. It never appears in any list,
 *   picker, count, or public page again. The row survives only so contracts,
 *   payments, and audit entries that point at it stay readable.
 *
 * Deleting also parks the record, so a query that only knows about `isActive`
 * still cannot surface a deleted row.
 */

export type RecordStatus = 'active' | 'inactive';

export const RECORD_STATUS_TABS: { value: RecordStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
];

export function parseRecordStatus(value: string | null | undefined): RecordStatus {
  return value === 'inactive' ? 'inactive' : 'active';
}

/** Prisma `where` fragment: never deleted, and exactly one status bucket. */
export function recordStatusWhere(status: RecordStatus) {
  return { deletedAt: null, isActive: status === 'active' } as const;
}

/** Prisma `where` fragment for anything a soft delete must hide, whatever its status. */
export const NOT_DELETED = { deletedAt: null } as const;
