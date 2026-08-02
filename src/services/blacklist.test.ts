import { describe, expect, it } from 'vitest';

import { UNCATEGORIZED, blacklistReasonLabel, blacklistReasonTone } from '@/lib/blacklist';
import { blacklistSchema } from '@/lib/validations';

describe('blacklistSchema', () => {
  it('requires a category and a kronologi when flagging someone', () => {
    const result = blacklistSchema.safeParse({
      isBlacklisted: true,
      blacklistReason: '',
      blacklistNote: '',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const fieldErrors = result.error.flatten().fieldErrors;
    expect(fieldErrors.blacklistReason).toBeDefined();
    expect(fieldErrors.blacklistNote).toBeDefined();
  });

  it('demands nothing when removing someone from the list', () => {
    const result = blacklistSchema.safeParse({
      isBlacklisted: false,
      blacklistReason: '',
      blacklistNote: '',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.blacklistReason).toBeNull();
    expect(result.data.blacklistNote).toBeNull();
  });

  it('accepts a complete entry', () => {
    const result = blacklistSchema.safeParse({
      isBlacklisted: true,
      blacklistReason: 'TUNGGAKAN',
      blacklistNote: 'Menunggak 3 bulan, pindah tanpa kabar pada Mei 2026.',
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.blacklistReason).toBe('TUNGGAKAN');
  });
});

describe('blacklist labels', () => {
  it('names the bucket for rows that predate the category column', () => {
    expect(blacklistReasonLabel(null)).toBe('Tanpa kategori');
    expect(UNCATEGORIZED).toBe('TANPA_KATEGORI');
  });

  it('reserves the destructive tone for KEAMANAN alone', () => {
    expect(blacklistReasonTone('KEAMANAN')).toBe('destructive');
    expect(blacklistReasonTone('TUNGGAKAN')).toBe('warning');
    expect(blacklistReasonTone(null)).toBe('secondary');
  });
});
