import { describe, expect, it } from 'vitest';

import { generateRoomNumbers, resolveInherited } from '@/lib/room-template';

const base = { mode: 'SEQUENCE' as const, floorId: null };

describe('generateRoomNumbers', () => {
  it('counts up from the start number', () => {
    expect(generateRoomNumbers({ ...base, startNumber: '101', count: 3 })).toEqual([
      '101',
      '102',
      '103',
    ]);
  });

  it('keeps the zero padding the admin typed', () => {
    expect(generateRoomNumbers({ ...base, startNumber: '08', count: 3 })).toEqual([
      '08',
      '09',
      '10',
    ]);
  });

  it('prepends the prefix', () => {
    expect(generateRoomNumbers({ ...base, prefix: 'A', startNumber: '1', count: 2 })).toEqual([
      'A1',
      'A2',
    ]);
  });

  it('takes a comma separated list verbatim, trimmed and deduped', () => {
    expect(
      generateRoomNumbers({ ...base, mode: 'LIST', numbers: 'A2, A3 , A2, , A4' }),
    ).toEqual(['A2', 'A3', 'A4']);
  });

  it('yields nothing when the sequence is incomplete', () => {
    expect(generateRoomNumbers({ ...base, startNumber: '', count: 5 })).toEqual([]);
    expect(generateRoomNumbers({ ...base, startNumber: '101', count: 0 })).toEqual([]);
  });
});

describe('resolveInherited', () => {
  it('uses the room’s own rows when it has any', () => {
    expect(resolveInherited(['ac'], ['kasur', 'lemari'])).toEqual({
      items: ['ac'],
      source: 'ROOM',
    });
  });

  it('falls back to the type when the room has none', () => {
    expect(resolveInherited([], ['kasur'])).toEqual({ items: ['kasur'], source: 'TYPE' });
  });

  it('never merges the two lists', () => {
    const { items } = resolveInherited(['ac'], ['kasur']);
    expect(items).not.toContain('kasur');
  });
});
