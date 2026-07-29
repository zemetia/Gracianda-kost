import { describe, it, expect } from 'vitest';

import { addCycles, firstPeriod, periodsInRange } from '@/lib/billing';

// Pure date calculation logic copied from NewContractForm for verification
function calculateEndDate(startDateStr: string, cycle: string, interval: number, duration: number): string {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';

  if (cycle === 'DAILY') {
    date.setDate(date.getDate() + (interval * duration));
  } else if (cycle === 'WEEKLY') {
    date.setDate(date.getDate() + (interval * duration * 7));
  } else if (cycle === 'MONTHLY') {
    date.setMonth(date.getMonth() + (interval * duration));
  } else if (cycle === 'YEARLY') {
    date.setFullYear(date.getFullYear() + (interval * duration));
  }

  return date.toISOString().split('T')[0] || '';
}

const july = (day: number) => new Date(2026, 6, day);

describe('Billing Cycles Calculations', () => {
  describe('calculateEndDate', () => {
    it('should calculate daily end date correctly', () => {
      expect(calculateEndDate('2026-07-01', 'DAILY', 1, 3)).toBe('2026-07-04');
    });

    it('should calculate weekly end date correctly', () => {
      expect(calculateEndDate('2026-07-01', 'WEEKLY', 1, 2)).toBe('2026-07-15');
    });

    it('should calculate monthly end date correctly', () => {
      expect(calculateEndDate('2026-07-01', 'MONTHLY', 1, 1)).toBe('2026-08-01');
      expect(calculateEndDate('2026-07-01', 'MONTHLY', 3, 1)).toBe('2026-10-01'); // 3 bulanan
    });

    it('should calculate yearly end date correctly', () => {
      expect(calculateEndDate('2026-07-01', 'YEARLY', 1, 1)).toBe('2027-07-01');
    });
  });

  describe('addCycles', () => {
    it('advances by days, weeks, months and years', () => {
      expect(addCycles(july(1), 'DAILY', 1)).toEqual(july(2));
      expect(addCycles(july(1), 'WEEKLY', 1)).toEqual(july(8));
      expect(addCycles(july(1), 'MONTHLY', 3)).toEqual(new Date(2026, 9, 1));
      expect(addCycles(july(1), 'YEARLY', 1)).toEqual(new Date(2027, 6, 1));
    });

    it('clamps month-end instead of overflowing into the next month', () => {
      // 31 Jan + 1 month must be 28 Feb, not 3 Mar.
      expect(addCycles(new Date(2026, 0, 31), 'MONTHLY', 1)).toEqual(new Date(2026, 1, 28));
    });
  });

  describe('firstPeriod', () => {
    it('spans exactly one billing cycle from the start date', () => {
      const period = firstPeriod({
        billingCycle: 'MONTHLY',
        billingInterval: 1,
        startDate: july(17),
      });
      expect(period.start).toEqual(july(17));
      expect(period.end).toEqual(new Date(2026, 7, 17));
    });
  });

  describe('periodsInRange', () => {
    const augustRange = { start: new Date(2026, 7, 1), end: new Date(2026, 8, 1) };

    it('bills a monthly contract once per month, on its own anniversary day', () => {
      const periods = periodsInRange(
        { billingCycle: 'MONTHLY', billingInterval: 1, startDate: july(15) },
        augustRange.start,
        augustRange.end,
      );
      expect(periods).toHaveLength(1);
      expect(periods[0]?.start).toEqual(new Date(2026, 7, 15));
    });

    it('bills a quarterly contract only on its due month', () => {
      const quarterly = { billingCycle: 'MONTHLY', billingInterval: 3, startDate: july(15) };

      expect(periodsInRange(quarterly, augustRange.start, augustRange.end)).toHaveLength(0);
      expect(
        periodsInRange(quarterly, new Date(2026, 9, 1), new Date(2026, 10, 1)),
      ).toHaveLength(1);
    });

    it('produces many periods per month for daily and weekly contracts', () => {
      const julyRange = { start: july(1), end: new Date(2026, 7, 1) };

      expect(
        periodsInRange({ billingCycle: 'DAILY', billingInterval: 1, startDate: july(1) }, julyRange.start, julyRange.end),
      ).toHaveLength(31);
      expect(
        periodsInRange({ billingCycle: 'WEEKLY', billingInterval: 1, startDate: july(1) }, julyRange.start, julyRange.end),
      ).toHaveLength(5);
    });

    it('stops billing once the contract end date is reached', () => {
      const ending = {
        billingCycle: 'MONTHLY',
        billingInterval: 1,
        startDate: july(1),
        endDate: new Date(2026, 8, 1),
      };

      expect(periodsInRange(ending, augustRange.start, augustRange.end)).toHaveLength(1);
      expect(periodsInRange(ending, new Date(2026, 8, 1), new Date(2026, 9, 1))).toHaveLength(0);
    });
  });
});
