// Server-only: Prisma-backed aggregate service for the admin dashboard.
// All widgets are computed here, not stored — same "derive, don't cache stale
// state" principle as getPaymentStatus().

import { prisma } from '@/lib/prisma';

import { getPaymentStatus } from './payment.service';

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export const dashboardService = {
  async getRoomStats() {
    const [total, occupied] = await Promise.all([
      prisma.room.count({ where: { isActive: true } }),
      prisma.room.count({ where: { isActive: true, contracts: { some: { status: 'ACTIVE' } } } }),
    ]);
    return { total, occupied, available: total - occupied };
  },

  async getRevenueThisMonth(): Promise<number> {
    const now = new Date();
    const agg = await prisma.payment.aggregate({
      where: { periodMonth: now.getMonth() + 1, periodYear: now.getFullYear() },
      _sum: { amountPaid: true },
    });
    return agg._sum.amountPaid?.toNumber() ?? 0;
  },

  // Payment status is derived, not stored, so overdue count needs a JS filter
  // over candidates rather than a single WHERE clause — see getPaymentStatus().
  async getOverdueCount(): Promise<number> {
    const today = new Date();
    const candidates = await prisma.payment.findMany({
      where: { dueDate: { lt: today } },
      select: { amountDue: true, amountPaid: true, dueDate: true },
    });
    return candidates.filter((p) => getPaymentStatus(p, today) === 'OVERDUE').length;
  },

  async getMaintenanceThisMonth() {
    const { start, end } = monthRange();
    const [count, costAgg] = await Promise.all([
      prisma.maintenanceRecord.count({ where: { date: { gte: start, lt: end } } }),
      prisma.maintenanceRecord.aggregate({ where: { date: { gte: start, lt: end } }, _sum: { cost: true } }),
    ]);
    return { count, totalCost: costAgg._sum.cost?.toNumber() ?? 0 };
  },

  async getIncidentsThisMonth() {
    const { start, end } = monthRange();
    const incidents = await prisma.incident.findMany({
      where: { date: { gte: start, lt: end } },
      select: { status: true },
    });
    return {
      total: incidents.length,
      open: incidents.filter((i) => i.status === 'OPEN').length,
      inProgress: incidents.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
    };
  },

  // Last `count` periods (by periodMonth/periodYear), oldest first — feeds the
  // dashboard revenue trend chart.
  async getRevenueTrend(count = 6) {
    const now = new Date();
    const periods = Array.from({ length: count }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    return Promise.all(
      periods.map(async (period) => {
        const agg = await prisma.payment.aggregate({
          where: { periodMonth: period.month, periodYear: period.year },
          _sum: { amountPaid: true },
        });
        return { ...period, total: agg._sum.amountPaid?.toNumber() ?? 0 };
      }),
    );
  },
};
