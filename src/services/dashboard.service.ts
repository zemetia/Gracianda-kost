// Server-only: Prisma-backed aggregate service for the admin dashboard.
// All widgets are computed here, not stored — same "derive, don't cache stale
// state" principle as getPaymentStatus().

import { prisma } from '@/lib/prisma';
import { DUE_SOON_DAYS, getPaymentBucket, paymentService } from './payment.service';

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

/** Everything the admin is expected to act on today, in one shape. */
export interface ActionQueue {
  overdue: { count: number; amount: number };
  dueSoon: { count: number; amount: number };
  contractsEndingSoon: number;
  openIncidents: number;
  vacantRooms: number;
  missingInvoices: number;
}

const ENDING_SOON_DAYS = 30;

export const dashboardService = {
  async getRoomStats(propertyId?: string) {
    const [total, occupied] = await Promise.all([
      prisma.room.count({ where: { isActive: true, propertyId: propertyId || undefined } }),
      prisma.room.count({
        where: {
          isActive: true,
          propertyId: propertyId || undefined,
          contracts: { some: { status: 'ACTIVE' } },
        },
      }),
    ]);
    return { total, occupied, available: total - occupied };
  },

  async getRevenueThisMonth(propertyId?: string): Promise<number> {
    const now = new Date();
    const agg = await prisma.payment.aggregate({
      where: {
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        contract: propertyId ? { room: { propertyId } } : undefined,
      },
      _sum: { amountPaid: true },
    });
    return agg._sum.amountPaid?.toNumber() ?? 0;
  },

  /**
   * The work list that replaces "admin has to remember". Every entry is a
   * count the admin can act on; the UI hides any entry that is zero, so a
   * quiet day shows an empty queue rather than a wall of zeroes.
   */
  async getActionQueue(propertyId?: string): Promise<ActionQueue> {
    const today = new Date();
    const dueSoonLimit = new Date();
    dueSoonLimit.setDate(dueSoonLimit.getDate() + DUE_SOON_DAYS);
    const endingSoonLimit = new Date();
    endingSoonLimit.setDate(endingSoonLimit.getDate() + ENDING_SOON_DAYS);

    const contractScope = propertyId ? { room: { propertyId } } : undefined;

    const [candidates, contractsEndingSoon, openIncidents, vacantRooms, missingInvoices] =
      await Promise.all([
        // OVERDUE vs DUE_SOON is derived, so the split happens in JS — but the
        // WHERE clause still drops everything already settled, otherwise this
        // scan grows with every paid invoice the building has ever issued.
        prisma.payment.findMany({
          where: {
            dueDate: { lte: dueSoonLimit },
            amountPaid: { lt: prisma.payment.fields.amountDue },
            contract: contractScope,
          },
          select: { amountDue: true, amountPaid: true, dueDate: true },
        }),
        prisma.contract.count({
          where: {
            status: 'ACTIVE',
            endDate: { gte: today, lte: endingSoonLimit },
            ...(propertyId ? { room: { propertyId } } : {}),
          },
        }),
        prisma.incident.count({ where: { status: 'OPEN', propertyId: propertyId || undefined } }),
        prisma.room.count({
          where: {
            isActive: true,
            propertyId: propertyId || undefined,
            contracts: { none: { status: 'ACTIVE' } },
          },
        }),
        paymentService.countMissingInvoices(today.getMonth() + 1, today.getFullYear(), propertyId),
      ]);

    const queue: ActionQueue = {
      overdue: { count: 0, amount: 0 },
      dueSoon: { count: 0, amount: 0 },
      contractsEndingSoon,
      openIncidents,
      vacantRooms,
      missingInvoices,
    };

    for (const payment of candidates) {
      const bucket = getPaymentBucket(payment, today);
      if (bucket === 'PAID' || bucket === 'UPCOMING') continue;

      const target = bucket === 'OVERDUE' ? queue.overdue : queue.dueSoon;
      target.count += 1;
      target.amount += Number(payment.amountDue) - Number(payment.amountPaid);
    }

    return queue;
  },

  async getMaintenanceThisMonth(propertyId?: string) {
    const { start, end } = monthRange();
    const [count, costAgg] = await Promise.all([
      prisma.maintenanceRecord.count({
        where: {
          date: { gte: start, lt: end },
          propertyId: propertyId || undefined,
        },
      }),
      prisma.maintenanceRecord.aggregate({
        where: {
          date: { gte: start, lt: end },
          propertyId: propertyId || undefined,
        },
        _sum: { cost: true },
      }),
    ]);
    return { count, totalCost: costAgg._sum.cost?.toNumber() ?? 0 };
  },

  async getIncidentsThisMonth(propertyId?: string) {
    const { start, end } = monthRange();
    const incidents = await prisma.incident.findMany({
      where: {
        date: { gte: start, lt: end },
        propertyId: propertyId || undefined,
      },
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
  async getRevenueTrend(count = 6, propertyId?: string) {
    const now = new Date();
    const periods = Array.from({ length: count }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    return Promise.all(
      periods.map(async (period) => {
        const agg = await prisma.payment.aggregate({
          where: {
            periodMonth: period.month,
            periodYear: period.year,
            contract: propertyId ? { room: { propertyId } } : undefined,
          },
          _sum: { amountPaid: true },
        });
        return { ...period, total: agg._sum.amountPaid?.toNumber() ?? 0 };
      }),
    );
  },
};
