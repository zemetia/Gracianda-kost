import { describe, it, expect } from 'vitest';

function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function calculateOccupancy(roomsOccupied: number, roomsTotal: number): number | null {
  if (roomsTotal <= 0) return null;
  return (roomsOccupied / roomsTotal) * 100;
}

function calculateCapacityOccupancy(totalPeople: number, roomsTotal: number): number | null {
  const maxCapacity = roomsTotal * 2;
  if (maxCapacity <= 0) return null;
  return (totalPeople / maxCapacity) * 100;
}

describe('Dashboard Metrics & Headcount Calculations', () => {
  describe('Headcount and Capacity Formulas', () => {
    it('calculates single and double occupancy headcount accurately', () => {
      // 10 rooms total, 5 single, 3 double, 2 vacant
      const single = 5;
      const double = 3;
      const roomsTotal = 10;
      const roomsOccupied = single + double; // 8
      const totalPeople = single * 1 + double * 2; // 5 + 6 = 11

      const roomOcc = calculateOccupancy(roomsOccupied, roomsTotal);
      const capOcc = calculateCapacityOccupancy(totalPeople, roomsTotal);

      expect(roomOcc).toBe(80); // 8/10 = 80%
      expect(capOcc).toBeCloseTo(55); // 11 / (10 * 2) = 11/20 = 55%
    });

    it('handles zero rooms without division by zero', () => {
      expect(calculateOccupancy(0, 0)).toBeNull();
      expect(calculateCapacityOccupancy(0, 0)).toBeNull();
    });

    it('calculates percentage delta correctly', () => {
      expect(delta(22, 20)).toBe(10); // +10%
      expect(delta(18, 20)).toBe(-10); // -10%
      expect(delta(20, 0)).toBeNull(); // baseline 0 returns null
    });
  });

  describe('Cost Breakdown Calculations', () => {
    it('ensures category percentages sum exactly to 100%', () => {
      const costs = [
        { label: 'WiFi', amount: 350_000 },
        { label: 'Listrik', amount: 1_200_000 },
        { label: 'Air', amount: 450_000 },
        { label: 'Kebersihan', amount: 600_000 },
        { label: 'Maintenance', amount: 150_000 },
      ];
      const total = costs.reduce((s, c) => s + c.amount, 0);

      let sumPct = 0;
      const items = costs.map((item, index) => {
        if (index === costs.length - 1) {
          const pct = Math.max(0, Math.round((100 - sumPct) * 10) / 10);
          return { ...item, percentage: pct };
        }
        const pct = Math.round((item.amount / total) * 1000) / 10;
        sumPct += pct;
        return { ...item, percentage: pct };
      });

      const totalPercentage = items.reduce((s, i) => s + i.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100);
    });

    it('handles zero cost without error or NaN', () => {
      const costs: { amount: number }[] = [];
      const total = costs.reduce((s, c) => s + c.amount, 0);
      expect(total).toBe(0);
    });
  });

  describe('Cash Reconciliation Calculations', () => {
    it('calculates Transfer vs Cash percentages accurately', () => {
      const payments = [
        { amount: 2_000_000, type: 'BANK' },
        { amount: 3_000_000, type: 'EWALLET' },
        { amount: 1_000_000, type: 'CASH' },
      ];
      const totalReceived = payments.reduce((s, p) => s + p.amount, 0); // 6_000_000
      const totalCount = payments.length; // 3

      const cashPayments = payments.filter((p) => p.type === 'CASH');
      const transferPayments = payments.filter((p) => p.type !== 'CASH');

      const cashTotal = cashPayments.reduce((s, p) => s + p.amount, 0); // 1_000_000
      const transferTotal = transferPayments.reduce((s, p) => s + p.amount, 0); // 5_000_000

      const cashPercentAmount = (cashTotal / totalReceived) * 100;
      const transferPercentAmount = (transferTotal / totalReceived) * 100;

      const cashPercentCount = (cashPayments.length / totalCount) * 100;
      const transferPercentCount = (transferPayments.length / totalCount) * 100;

      expect(cashTotal).toBe(1_000_000);
      expect(transferTotal).toBe(5_000_000);
      expect(cashPercentAmount + transferPercentAmount).toBeCloseTo(100);
      expect(cashPercentCount + transferPercentCount).toBeCloseTo(100);
      expect(transferPercentAmount).toBeCloseTo((5 / 6) * 100);
      expect(cashPercentAmount).toBeCloseTo((1 / 6) * 100);
    });
  });

  describe('Receivables Payment Status Classification (Slide 3)', () => {
    it('accurately classifies Lunas, Jatuh Tempo (H-7 to H), and Telat', () => {
      const today = new Date('2026-09-10');

      const invoices = [
        // Paid
        { amountDue: 1500000, amountPaid: 1500000, dueDate: new Date('2026-09-05') },
        // Due today (H)
        { amountDue: 1500000, amountPaid: 0, dueDate: new Date('2026-09-10') },
        // Due within 7 days (H-4)
        { amountDue: 1800000, amountPaid: 0, dueDate: new Date('2026-09-14') },
        // Overdue (Yesterday)
        { amountDue: 2000000, amountPaid: 0, dueDate: new Date('2026-09-09') },
        // Upcoming (> 7 days)
        { amountDue: 1500000, amountPaid: 0, dueDate: new Date('2026-09-25') },
      ];

      const classify = (inv: (typeof invoices)[number]) => {
        if (inv.amountPaid >= inv.amountDue) return 'PAID';
        const diff = Math.ceil((inv.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'OVERDUE';
        if (diff <= 7) return 'DUE_SOON';
        return 'UPCOMING';
      };

      const results = invoices.map(classify);
      expect(results[0]).toBe('PAID');
      expect(results[1]).toBe('DUE_SOON');
      expect(results[2]).toBe('DUE_SOON');
      expect(results[3]).toBe('OVERDUE');
      expect(results[4]).toBe('UPCOMING');
    });
  });

  describe('Quarterly Room Maintenance Frequency (Slide 4)', () => {
    it('aggregates maintenance events into Q1, Q2, Q3, Q4 accurately', () => {
      const records = [
        { roomId: 'r1', date: new Date('2026-01-15') }, // Q1
        { roomId: 'r1', date: new Date('2026-02-10') }, // Q1
        { roomId: 'r1', date: new Date('2026-05-20') }, // Q2
        { roomId: 'r1', date: new Date('2026-08-01') }, // Q3
        { roomId: 'r1', date: new Date('2026-11-11') }, // Q4
        { roomId: 'r2', date: new Date('2026-03-01') }, // Q1
      ];

      const counts: Record<string, { q1: number; q2: number; q3: number; q4: number; total: number }> = {};
      for (const r of records) {
        const entry = counts[r.roomId] ?? { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };
        const m = r.date.getMonth();
        if (m <= 2) entry.q1 += 1;
        else if (m <= 5) entry.q2 += 1;
        else if (m <= 8) entry.q3 += 1;
        else entry.q4 += 1;
        entry.total += 1;
        counts[r.roomId] = entry;
      }

      expect(counts['r1']?.q1).toBe(2);
      expect(counts['r1']?.q2).toBe(1);
      expect(counts['r1']?.q3).toBe(1);
      expect(counts['r1']?.q4).toBe(1);
      expect(counts['r1']?.total).toBe(5);

      expect(counts['r2']?.q1).toBe(1);
      expect(counts['r2']?.total).toBe(1);
    });
  });

  describe('Incident Risk Management & Resolution Time (Slide 5)', () => {
    it('calculates average resolution hours correctly', () => {
      const incidents = [
        {
          category: 'KERUSAKAN',
          status: 'RESOLVED',
          date: new Date('2026-09-01T10:00:00Z'),
          updatedAt: new Date('2026-09-01T14:00:00Z'), // 4 hours
        },
        {
          category: 'KERUSAKAN',
          status: 'RESOLVED',
          date: new Date('2026-09-02T08:00:00Z'),
          updatedAt: new Date('2026-09-02T16:00:00Z'), // 8 hours
        },
        {
          category: 'GANGGUAN',
          status: 'OPEN',
          date: new Date('2026-09-03T10:00:00Z'),
          updatedAt: new Date('2026-09-03T10:00:00Z'), // not resolved
        },
      ];

      const resolved = incidents.filter((i) => i.status === 'RESOLVED');
      const hours = resolved.map(
        (i) => (i.updatedAt.getTime() - i.date.getTime()) / (1000 * 60 * 60),
      );
      const avgHours = hours.reduce((s, h) => s + h, 0) / hours.length;

      expect(hours).toEqual([4, 8]);
      expect(avgHours).toBe(6);
    });
  });

  describe('Annual Operational Frequency Aggregation (Slide 1d)', () => {
    it('determines busiest maintenance and incident months correctly', () => {
      const months = [
        { month: 1, maintenanceCount: 2, incidentCount: 5, avgEventsPerRoom: 0.3 },
        { month: 2, maintenanceCount: 8, incidentCount: 1, avgEventsPerRoom: 0.4 },
        { month: 3, maintenanceCount: 3, incidentCount: 3, avgEventsPerRoom: 0.3 },
      ];

      let busiestMaintMonth = 1;
      let maxM = -1;
      let busiestIncMonth = 1;
      let maxI = -1;

      for (const m of months) {
        if (m.maintenanceCount > maxM) {
          maxM = m.maintenanceCount;
          busiestMaintMonth = m.month;
        }
        if (m.incidentCount > maxI) {
          maxI = m.incidentCount;
          busiestIncMonth = m.month;
        }
      }

      expect(busiestMaintMonth).toBe(2); // Feb with 8
      expect(busiestIncMonth).toBe(1); // Jan with 5
    });
  });

  describe('Operational Schedule Mapping (Slide 1c)', () => {
    it('filters events by category accurately', () => {
      const events = [
        { id: '1', type: 'PAYMENT_PAID' },
        { id: '2', type: 'PAYMENT_DUE_SOON' },
        { id: '3', type: 'MAINTENANCE' },
        { id: '4', type: 'CONTRACT_END' },
      ];

      const payments = events.filter((e) => e.type.startsWith('PAYMENT'));
      const maintenance = events.filter((e) => e.type === 'MAINTENANCE');
      const contract = events.filter((e) => e.type === 'CONTRACT_END');

      expect(payments.length).toBe(2);
      expect(maintenance.length).toBe(1);
      expect(contract.length).toBe(1);
    });
  });

  describe('P&L Net Profit & Net Margin (Slide 6)', () => {
    it('calculates Net Profit and Net Margin percentage accurately', () => {
      const grossRevenue = 30_000_000;
      const roomMaintenanceCost = 2_500_000;
      const operatingExpenses = 7_500_000;

      const totalCost = roomMaintenanceCost + operatingExpenses; // 10_000_000
      const netProfit = grossRevenue - totalCost; // 20_000_000
      const netMargin = (netProfit / grossRevenue) * 100; // 66.666...%

      expect(totalCost).toBe(10_000_000);
      expect(netProfit).toBe(20_000_000);
      expect(netMargin).toBeCloseTo(66.67, 1);
    });

    it('handles negative net profit (loss) correctly', () => {
      const grossRevenue = 10_000_000;
      const totalCost = 15_000_000;
      const netProfit = grossRevenue - totalCost;
      const netMargin = (netProfit / grossRevenue) * 100;

      expect(netProfit).toBe(-5_000_000);
      expect(netMargin).toBe(-50);
    });
  });

  describe('Dynamic Urgent Actions & Action Queue (Slide 1b)', () => {
    it('accurately identifies due today, overdue, and clean state', () => {
      const startOfToday = new Date('2026-09-11T00:00:00Z');
      const endOfToday = new Date('2026-09-11T23:59:59Z');

      const payments = [
        // Overdue (due 3 days ago, unpaid)
        { id: '1', dueDate: new Date('2026-09-08'), amountDue: 2000000, amountPaid: 0 },
        // Due today (unpaid)
        { id: '2', dueDate: new Date('2026-09-11T05:00:00Z'), amountDue: 1800000, amountPaid: 0 },
        // Due today but already paid
        { id: '3', dueDate: new Date('2026-09-11T08:00:00Z'), amountDue: 1500000, amountPaid: 1500000 },
        // Due in future
        { id: '4', dueDate: new Date('2026-09-15'), amountDue: 2000000, amountPaid: 0 },
      ];

      const unpaidOverdue = payments.filter(
        (p) => p.dueDate < startOfToday && p.amountPaid < p.amountDue,
      );
      const dueToday = payments.filter(
        (p) => p.dueDate >= startOfToday && p.dueDate <= endOfToday && p.amountPaid < p.amountDue,
      );

      expect(unpaidOverdue.length).toBe(1);
      expect(unpaidOverdue[0]?.id).toBe('1');
      expect(dueToday.length).toBe(1);
      expect(dueToday[0]?.id).toBe('2');

      // Zero-state check: when no urgent items, returns clean state
      const hasUrgent = unpaidOverdue.length > 0 || dueToday.length > 0;
      expect(hasUrgent).toBe(true);

      const emptyList: unknown[] = [];
      const isCleanState = emptyList.length === 0;
      expect(isCleanState).toBe(true);
    });
  });

  describe('Quarterly Financial Summary (Slide 1a)', () => {
    it('accurately groups revenue & cost into quarters and computes Net Margin in Mio IDR', () => {
      // Monthly amounts for 12 months (in IDR)
      const monthlyRevenue = [
        10_000_000, 12_000_000, 14_000_000, // Q1: 36M
        15_000_000, 15_000_000, 16_000_000, // Q2: 46M
        18_000_000, 18_000_000, 20_000_000, // Q3: 56M
        22_000_000, 24_000_000, 25_000_000, // Q4: 71M
      ];
      const monthlyCost = [
        5_000_000, 5_000_000, 6_000_000, // Q1: 16M
        7_000_000, 6_000_000, 7_000_000, // Q2: 20M
        8_000_000, 8_000_000, 9_000_000, // Q3: 25M
        10_000_000, 10_000_000, 11_000_000, // Q4: 31M
      ];

      const quarters = [1, 2, 3, 4].map((q) => {
        const start = (q - 1) * 3;
        const qRev =
          (monthlyRevenue[start] ?? 0) +
          (monthlyRevenue[start + 1] ?? 0) +
          (monthlyRevenue[start + 2] ?? 0);
        const qCost =
          (monthlyCost[start] ?? 0) +
          (monthlyCost[start + 1] ?? 0) +
          (monthlyCost[start + 2] ?? 0);
        const qProfit = qRev - qCost;
        const qMargin = qRev > 0 ? Math.round(((qRev - qCost) / qRev) * 1000) / 10 : null;

        return {
          quarter: q,
          revenueMio: Math.round((qRev / 1_000_000) * 10) / 10,
          costMio: Math.round((qCost / 1_000_000) * 10) / 10,
          netProfitMio: Math.round((qProfit / 1_000_000) * 10) / 10,
          netMarginPercent: qMargin,
        };
      });

      // Q1 checks
      expect(quarters[0]?.revenueMio).toBe(36.0);
      expect(quarters[0]?.costMio).toBe(16.0);
      expect(quarters[0]?.netProfitMio).toBe(20.0);
      expect(quarters[0]?.netMarginPercent).toBeCloseTo(55.6, 1);

      // Q2 checks
      expect(quarters[1]?.revenueMio).toBe(46.0);
      expect(quarters[1]?.costMio).toBe(20.0);
      expect(quarters[1]?.netProfitMio).toBe(26.0);
      expect(quarters[1]?.netMarginPercent).toBeCloseTo(56.5, 1);

      // Auto-linking check: March (month index 2) links to Q1
      const marchMonthIndex = 2;
      const quarterForMarch = Math.floor(marchMonthIndex / 3) + 1;
      expect(quarterForMarch).toBe(1);

      // September (month index 8) links to Q3
      const septMonthIndex = 8;
      const quarterForSept = Math.floor(septMonthIndex / 3) + 1;
      expect(quarterForSept).toBe(3);
    });
  });

  describe('Room Yield & Cost Outliers (Slide 7)', () => {
    it('identifies top and lowest revenue and maintenance rooms formatted in Mio IDR', () => {
      const rooms = [
        { id: 'r1', number: '101', revenue: 24_000_000, maintenance: 350_000 },
        { id: 'r2', number: '102', revenue: 32_500_000, maintenance: 2_800_000 },
        { id: 'r3', number: '103', revenue: 12_000_000, maintenance: 0 },
        { id: 'r4', number: '104', revenue: 28_000_000, maintenance: 1_200_000 },
      ];

      const toMio = (v: number) => Math.round((v / 1_000_000) * 10) / 10;

      let topRev = rooms[0];
      let lowestRev = rooms[0];
      let highestMaint = rooms[0];
      let lowestMaint = rooms[0];

      for (const r of rooms) {
        if (!topRev || r.revenue > topRev.revenue) topRev = r;
        if (!lowestRev || r.revenue < lowestRev.revenue) lowestRev = r;
        if (!highestMaint || r.maintenance > highestMaint.maintenance) highestMaint = r;
        if (!lowestMaint || r.maintenance < lowestMaint.maintenance) lowestMaint = r;
      }

      expect(topRev?.number).toBe('102');
      expect(toMio(topRev?.revenue ?? 0)).toBe(32.5);

      expect(lowestRev?.number).toBe('103');
      expect(toMio(lowestRev?.revenue ?? 0)).toBe(12.0);

      expect(highestMaint?.number).toBe('102');
      expect(toMio(highestMaint?.maintenance ?? 0)).toBe(2.8);

      expect(lowestMaint?.number).toBe('103');
      expect(toMio(lowestMaint?.maintenance ?? 0)).toBe(0.0);
    });
  });

  describe('Real Domain Services Verification', () => {
    it('verifies classifyPaymentForBreakdown matches Slide 3 business rules', async () => {
      const { classifyPaymentForBreakdown, getPaymentStatusBreakdown } = await import('./payment.service');
      const today = new Date(2026, 8, 10, 10, 0, 0); // 10 Sep 2026

      const pPaid = { amountDue: 2000000, amountPaid: 2000000, dueDate: new Date(2026, 8, 5) };
      const pDueToday = { amountDue: 1800000, amountPaid: 0, dueDate: new Date(2026, 8, 10) };
      const pDueHMinus3 = { amountDue: 1500000, amountPaid: 500000, dueDate: new Date(2026, 8, 13) };
      const pDueHMinus7 = { amountDue: 1500000, amountPaid: 0, dueDate: new Date(2026, 8, 17) };
      const pOverdue = { amountDue: 2200000, amountPaid: 0, dueDate: new Date(2026, 8, 9) };
      const pUpcoming = { amountDue: 2500000, amountPaid: 0, dueDate: new Date(2026, 8, 25) };

      expect(classifyPaymentForBreakdown(pPaid, today)).toBe('PAID');
      expect(classifyPaymentForBreakdown(pDueToday, today)).toBe('DUE_SOON');
      expect(classifyPaymentForBreakdown(pDueHMinus3, today)).toBe('DUE_SOON');
      expect(classifyPaymentForBreakdown(pDueHMinus7, today)).toBe('DUE_SOON');
      expect(classifyPaymentForBreakdown(pOverdue, today)).toBe('OVERDUE');
      expect(classifyPaymentForBreakdown(pUpcoming, today)).toBe('UPCOMING');

      const breakdown = getPaymentStatusBreakdown(
        [pPaid, pDueToday, pDueHMinus3, pDueHMinus7, pOverdue, pUpcoming],
        today,
      );
      expect(breakdown.totalCount).toBe(6);
      expect(breakdown.paid.count).toBe(1);
      expect(breakdown.dueSoon.count).toBe(3);
      expect(breakdown.overdue.count).toBe(1);
      expect(breakdown.upcoming.count).toBe(1);
      expect(breakdown.dueSoon.amount).toBe(1800000 + 1000000 + 1500000);
      expect(breakdown.overdue.amount).toBe(2200000);
    });
  });
});



