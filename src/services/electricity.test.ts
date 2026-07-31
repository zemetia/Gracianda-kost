import { describe, expect, it } from 'vitest';

import { electricityCharge, electricityModeLabel, isMetered } from '@/lib/electricity';

describe('electricityCharge', () => {
  it('multiplies usage by the tariff', () => {
    expect(electricityCharge(100, 1352)).toBe(135_200);
  });

  it('rounds to whole rupiah — a stored half-rupiah never reconciles with cash', () => {
    expect(electricityCharge(10.5, 1355)).toBe(14_228); // 14227.5
  });

  it('is zero when there is no usage or no tariff set yet', () => {
    expect(electricityCharge(0, 1352)).toBe(0);
    expect(electricityCharge(120, 0)).toBe(0);
  });

  it('never returns a negative charge from a bad reading', () => {
    expect(electricityCharge(-5, 1352)).toBe(0);
  });
});

describe('isMetered', () => {
  it('only METERED units are billed per kWh', () => {
    expect(isMetered('METERED')).toBe(true);
    expect(isMetered('FREE')).toBe(false);
    expect(isMetered('TOKEN')).toBe(false);
  });
});

describe('electricityModeLabel', () => {
  it('labels every mode in Indonesian', () => {
    expect(electricityModeLabel('FREE')).toBe('Gratis');
    expect(electricityModeLabel('TOKEN')).toBe('Token');
    expect(electricityModeLabel('METERED')).toBe('Bayar (non-token)');
  });
});
