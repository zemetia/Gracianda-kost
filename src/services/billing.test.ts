import { describe, it, expect } from 'vitest';

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

// Logic extracted from paymentService.generateMonthlyInvoices for testing pure functionality
function shouldBillContract(contract: {
  billingCycle: string;
  billingInterval: number;
  startDate: Date;
  endDate?: Date | null;
}, periodMonth: number, periodYear: number): boolean {
  if (contract.billingCycle === 'DAILY' || contract.billingCycle === 'WEEKLY') {
    return false;
  }

  const start = contract.startDate;
  const yDiff = periodYear - start.getFullYear();
  const mDiff = periodMonth - (start.getMonth() + 1);
  const monthsDiff = yDiff * 12 + mDiff;

  if (monthsDiff < 0) return false;

  if (contract.endDate) {
    const targetDate = new Date(periodYear, periodMonth - 1, 1);
    if (targetDate > contract.endDate) return false;
  }

  const intervalInMonths = contract.billingCycle === 'YEARLY'
    ? contract.billingInterval * 12
    : contract.billingInterval;

  return monthsDiff % intervalInMonths === 0;
}

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

  describe('shouldBillContract (generateMonthlyInvoices logic)', () => {
    it('should exclude DAILY and WEEKLY cycles', () => {
      const daily = { billingCycle: 'DAILY', billingInterval: 1, startDate: new Date('2026-07-01') };
      const weekly = { billingCycle: 'WEEKLY', billingInterval: 1, startDate: new Date('2026-07-01') };
      
      expect(shouldBillContract(daily, 7, 2026)).toBe(false);
      expect(shouldBillContract(weekly, 7, 2026)).toBe(false);
    });

    it('should bill standard monthly cycle every month', () => {
      const monthly = { billingCycle: 'MONTHLY', billingInterval: 1, startDate: new Date('2026-07-15') };
      
      expect(shouldBillContract(monthly, 7, 2026)).toBe(true); // Month 0
      expect(shouldBillContract(monthly, 8, 2026)).toBe(true); // Month 1
      expect(shouldBillContract(monthly, 9, 2026)).toBe(true); // Month 2
    });

    it('should bill quarterly (3-monthly) cycle only every 3 months', () => {
      const quarterly = { billingCycle: 'MONTHLY', billingInterval: 3, startDate: new Date('2026-07-15') };
      
      expect(shouldBillContract(quarterly, 7, 2026)).toBe(true);  // Month 0
      expect(shouldBillContract(quarterly, 8, 2026)).toBe(false); // Month 1
      expect(shouldBillContract(quarterly, 9, 2026)).toBe(false); // Month 2
      expect(shouldBillContract(quarterly, 10, 2026)).toBe(true); // Month 3 (Quarterly due!)
    });

    it('should respect contract endDate', () => {
      const monthlyWithEnd = { 
        billingCycle: 'MONTHLY', 
        billingInterval: 1, 
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-09-01')
      };
      
      expect(shouldBillContract(monthlyWithEnd, 8, 2026)).toBe(true);  // August is within range
      expect(shouldBillContract(monthlyWithEnd, 10, 2026)).toBe(false); // October is after endDate
    });
  });
});
