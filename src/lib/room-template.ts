/**
 * Pure rules for the room ↔ room-type relationship. Lives in `lib` (not the
 * service) so the service, the public floor plan, and the unit tests share one
 * implementation — a copy is a copy that silently drifts.
 */

import type { DuplicateRoomInput } from '@/lib/validations';

export type InheritedSource = 'ROOM' | 'TYPE';

/**
 * The override rule, applied per dimension (facilities, photos, …): a room
 * that has rows of its own wins outright; a room with none inherits every row
 * from its type. There is deliberately no merge — "kamar menimpa type" means
 * one list, never a union the admin has to mentally subtract from.
 */
export function resolveInherited<T>(
  own: readonly T[],
  fromType: readonly T[],
): { items: readonly T[]; source: InheritedSource } {
  return own.length > 0 ? { items: own, source: 'ROOM' } : { items: fromType, source: 'TYPE' };
}

/**
 * Unit numbers a bulk duplication should create. SEQUENCE keeps the zero
 * padding the admin typed (`01` → 01, 02, 03), LIST takes the numbers as
 * written. Duplicates within the batch are collapsed; clashes with rooms that
 * already exist are the service's job to reject.
 */
export function generateRoomNumbers(input: DuplicateRoomInput): string[] {
  const numbers =
    input.mode === 'LIST'
      ? (input.numbers ?? '').split(',').map((entry) => entry.trim())
      : sequenceNumbers(input);

  return [...new Set(numbers.filter(Boolean))];
}

function sequenceNumbers(input: DuplicateRoomInput): string[] {
  const start = input.startNumber ?? '';
  const count = input.count ?? 0;
  if (!start || count < 1) return [];

  const first = Number(start);
  const prefix = input.prefix?.trim() ?? '';

  return Array.from({ length: count }, (_, index) =>
    `${prefix}${String(first + index).padStart(start.length, '0')}`,
  );
}
