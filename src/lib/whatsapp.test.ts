import { describe, expect, it } from 'vitest';
import { buildWaLink, normalizePhone } from './whatsapp';

describe('WhatsApp helper', () => {
  describe('normalizePhone', () => {
    it('converts local 08 prefix to international 628', () => {
      expect(normalizePhone('081234567890')).toBe('6281234567890');
      expect(normalizePhone('0812-3456-7890')).toBe('6281234567890');
      expect(normalizePhone('0857 1234 5678')).toBe('6285712345678');
    });

    it('handles +62 and 62 prefixes with dashes and spaces', () => {
      expect(normalizePhone('+62 812-3456-7890')).toBe('6281234567890');
      expect(normalizePhone('6281234567890')).toBe('6281234567890');
    });

    it('cleans redundant 620 prefix (+62 08...)', () => {
      expect(normalizePhone('+62 0812-3456-7890')).toBe('6281234567890');
    });

    it('prefixes bare 8xxxxxxxx number with 62', () => {
      expect(normalizePhone('81234567890')).toBe('6281234567890');
    });

    it('preserves foreign international country codes', () => {
      expect(normalizePhone('+1 (555) 123-4567')).toBe('15551234567');
      expect(normalizePhone('+65 9123 4567')).toBe('6591234567');
    });
  });

  describe('buildWaLink', () => {
    it('generates valid wa.me URL with normalized phone and encoded message', () => {
      const url = buildWaLink('081234567890', 'Halo Budi, tagihan kos Rp 1.500.000');
      expect(url).toContain('https://wa.me/6281234567890?text=');
      expect(url).toContain(encodeURIComponent('Halo Budi, tagihan kos Rp 1.500.000'));
    });
  });
});
