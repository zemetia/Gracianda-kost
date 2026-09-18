// Server-only: Prisma-backed aggregate service for the admin dashboard.
// All widgets are computed here, not stored — same "derive, don't cache stale
// state" principle as getPaymentStatus().

import { prisma } from '@/lib/prisma';
import { recordStatusWhere } from '@/lib/record-status';
import { DUE_SOON_DAYS, getPaymentBucket, paymentService } from './payment.service';

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

// A contract counts as occupying its room "as of" a date based on lease
// validity, not the live `status` field — a contract already ENDED today was
// still active a month ago if its actualEndDate falls after that date.
function activeAsOfWhere(asOf: Date) {
  return {
    status: { not: 'CANCELLED' as const },
    startDate: { lte: asOf },
    OR: [
      {
        status: 'ACTIVE' as const,
        OR: [{ actualEndDate: null }, { actualEndDate: { gte: asOf } }],
      },
      {
        status: 'ENDED' as const,
        OR: [
          { actualEndDate: { gte: asOf } },
          { actualEndDate: null, endDate: { gte: asOf } },
        ],
      },
    ],
  };
}

export interface HeadcountSnapshot {
  roomsTotal: number;
  roomsOccupied: number;
  singleOccupancy: number;
  doubleOccupancy: number;
  totalPeople: number;
}

async function getHeadcountSnapshot(
  propertyId: string | undefined,
  asOf: Date,
): Promise<HeadcountSnapshot> {
  const rooms = await prisma.room.findMany({
    where: { ...recordStatusWhere('active'), propertyId: propertyId || undefined },
    select: {
      contracts: {
        where: activeAsOfWhere(asOf),
        select: { _count: { select: { occupants: true } } },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    },
  });

  const snapshot: HeadcountSnapshot = {
    roomsTotal: rooms.length,
    roomsOccupied: 0,
    singleOccupancy: 0,
    doubleOccupancy: 0,
    totalPeople: 0,
  };

  for (const room of rooms) {
    const contract = room.contracts[0];
    if (!contract) continue;
    const headcount = 1 + contract._count.occupants;
    snapshot.roomsOccupied += 1;
    snapshot.totalPeople += headcount;
    if (headcount >= 2) snapshot.doubleOccupancy += 1;
    else snapshot.singleOccupancy += 1;
  }

  return snapshot;
}

export interface UrgentActionItem {
  id: string;
  type: 'PAYMENT_DUE_TODAY' | 'PAYMENT_OVERDUE' | 'MAINTENANCE_TODAY' | 'CRITICAL_INCIDENT';
  roomNumber: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning';
  actionLabel: string;
  actionHref: string;
  paymentDetails?: {
    paymentId: string;
    phone: string;
    tenantName: string;
    contractCode: string;
    roomNumber: string;
    periodMonth: number;
    periodYear: number;
    amountDue: number;
    amountPaid: number;
    dueDate: Date;
  };
}

/** Everything the admin is expected to act on today, in one shape. */
export interface ActionQueue {
  urgentItems: UrgentActionItem[];
  overdue: { count: number; amount: number };
  dueSoon: { count: number; amount: number };
  dueToday: { count: number; amount: number };
  contractsEndingSoon: number;
  openIncidents: number;
  vacantRooms: number;
  missingInvoices: number;
}

const ENDING_SOON_DAYS = 30;

export const dashboardService = {
  async getRoomStats(propertyId?: string) {
    const [total, occupied] = await Promise.all([
      prisma.room.count({
        where: { ...recordStatusWhere('active'), propertyId: propertyId || undefined },
      }),
      prisma.room.count({
        where: {
          ...recordStatusWhere('active'),
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
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const dueSoonLimit = new Date(today);
    dueSoonLimit.setDate(dueSoonLimit.getDate() + DUE_SOON_DAYS);
    const endingSoonLimit = new Date(today);
    endingSoonLimit.setDate(endingSoonLimit.getDate() + ENDING_SOON_DAYS);

    const contractScope = propertyId ? { room: { propertyId } } : undefined;

    const [
      candidates,
      contractsEndingSoon,
      openIncidentsCount,
      vacantRooms,
      missingInvoices,
      maintenanceRecordsToday,
      openIncidentsList,
    ] = await Promise.all([
      // OVERDUE vs DUE_SOON is derived, so the split happens in JS — but the
      // WHERE clause still drops everything already settled, otherwise this
      // scan grows with every paid invoice the building has ever issued.
      prisma.payment.findMany({
        where: {
          dueDate: { lte: dueSoonLimit },
          amountPaid: { lt: prisma.payment.fields.amountDue },
          contract: contractScope,
        },
        include: {
          contract: {
            include: {
              room: true,
              tenant: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
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
          ...recordStatusWhere('active'),
          propertyId: propertyId || undefined,
          contracts: { none: { status: 'ACTIVE' } },
        },
      }),
      paymentService.countMissingInvoices(today.getMonth() + 1, today.getFullYear(), propertyId),
      prisma.maintenanceRecord.findMany({
        where: {
          date: { gte: startOfToday, lte: endOfToday },
          propertyId: propertyId || undefined,
        },
        include: {
          room: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.incident.findMany({
        where: {
          status: 'OPEN',
          propertyId: propertyId || undefined,
        },
        include: {
          room: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    const urgentItems: UrgentActionItem[] = [];
    const queue: ActionQueue = {
      urgentItems,
      overdue: { count: 0, amount: 0 },
      dueSoon: { count: 0, amount: 0 },
      dueToday: { count: 0, amount: 0 },
      contractsEndingSoon,
      openIncidents: openIncidentsCount,
      vacantRooms,
      missingInvoices,
    };

    for (const payment of candidates) {
      const bucket = getPaymentBucket(payment, today);
      if (bucket === 'PAID' || bucket === 'UPCOMING') continue;

      const unpaid = Number(payment.amountDue) - Number(payment.amountPaid);
      const target = bucket === 'OVERDUE' ? queue.overdue : queue.dueSoon;
      target.count += 1;
      target.amount += unpaid;

      const pDueDate = new Date(payment.dueDate);
      const isDueToday = pDueDate >= startOfToday && pDueDate <= endOfToday;
      if (isDueToday) {
        queue.dueToday.count += 1;
        queue.dueToday.amount += unpaid;
      }

      const roomNum = payment.contract.room.number;
      const tenant = payment.contract.tenant;
      const tenantPhone = tenant.phone;
      const tenantName = tenant.fullName;

      if (bucket === 'OVERDUE') {
        const diffDays = Math.max(
          1,
          Math.floor((startOfToday.getTime() - pDueDate.getTime()) / (1000 * 60 * 60 * 24)),
        );
        urgentItems.push({
          id: `overdue-${payment.id}`,
          type: 'PAYMENT_OVERDUE',
          roomNumber: roomNum,
          title: `Kamar ${roomNum} - Terlambat ${diffDays} Hari`,
          detail: `Sisa tagihan Rp ${unpaid.toLocaleString('id-ID')} (${tenantName})`,
          severity: 'critical',
          actionLabel: tenantPhone ? 'Kirim Reminder WA' : 'Lihat Tagihan',
          actionHref: `/admin/payments?bucket=OVERDUE${propertyId ? `&propertyId=${propertyId}` : ''}`,
          paymentDetails: tenantPhone
            ? {
                paymentId: payment.id,
                phone: tenantPhone,
                tenantName,
                contractCode: payment.contract.contractCode,
                roomNumber: roomNum,
                periodMonth: payment.periodMonth,
                periodYear: payment.periodYear,
                amountDue: Number(payment.amountDue),
                amountPaid: Number(payment.amountPaid),
                dueDate: payment.dueDate,
              }
            : undefined,
        });
      } else if (isDueToday) {
        urgentItems.push({
          id: `due-today-${payment.id}`,
          type: 'PAYMENT_DUE_TODAY',
          roomNumber: roomNum,
          title: `Kamar ${roomNum} - Jatuh Tempo Hari Ini`,
          detail: `Tagihan Rp ${unpaid.toLocaleString('id-ID')} (${tenantName})`,
          severity: 'warning',
          actionLabel: tenantPhone ? 'Kirim Reminder WA' : 'Lihat Tagihan',
          actionHref: `/admin/payments?bucket=DUE_SOON${propertyId ? `&propertyId=${propertyId}` : ''}`,
          paymentDetails: tenantPhone
            ? {
                paymentId: payment.id,
                phone: tenantPhone,
                tenantName,
                contractCode: payment.contract.contractCode,
                roomNumber: roomNum,
                periodMonth: payment.periodMonth,
                periodYear: payment.periodYear,
                amountDue: Number(payment.amountDue),
                amountPaid: Number(payment.amountPaid),
                dueDate: payment.dueDate,
              }
            : undefined,
        });
      }
    }

    for (const m of maintenanceRecordsToday) {
      const roomNum = m.room?.number ?? 'Gedung';
      urgentItems.push({
        id: `maint-${m.id}`,
        type: 'MAINTENANCE_TODAY',
        roomNumber: roomNum,
        title: `Kamar ${roomNum} - Service ${m.category}`,
        detail: `Vendor: ${m.vendor ?? 'Teknisi'} • ${m.notes || 'Dijadwalkan hari ini'}`,
        severity: 'warning',
        actionLabel: 'Detail Perawatan',
        actionHref: `/admin/reports/maintenance`,
      });
    }

    for (const inc of openIncidentsList) {
      const roomNum = inc.room?.number ?? (inc.location || 'Area Publik');
      urgentItems.push({
        id: `incident-${inc.id}`,
        type: 'CRITICAL_INCIDENT',
        roomNumber: roomNum,
        title: `Insiden: ${inc.category.replace(/_/g, ' ')} (${roomNum})`,
        detail: inc.description,
        severity: 'critical',
        actionLabel: 'Tindak Lanjut',
        actionHref: `/admin/incidents`,
      });
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

  /**
   * Total headcount (tenant + occupants) across every room, plus the room-vs-
   * capacity occupancy split. `previous` is the same snapshot one calendar
   * month ago, reconstructed from lease dates, so the dashboard can show a
   * "vs bulan lalu" delta without assuming 1 kamar = 1 orang.
   */
  async getHeadcountStats(propertyId?: string) {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [current, previous] = await Promise.all([
      getHeadcountSnapshot(propertyId, now),
      getHeadcountSnapshot(propertyId, oneMonthAgo),
    ]);

    return { current, previous };
  },

  // Last `count` periods, oldest first — feeds the dashboard headcount trend
  // chart. Earlier periods are reconstructed as-of their last calendar day
  // (see activeAsOfWhere); the most recent period uses the real current date
  // so it matches getHeadcountStats().current exactly.
  async getHeadcountTrend(count = 6, propertyId?: string) {
    const now = new Date();
    const periods = Array.from({ length: count }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    return Promise.all(
      periods.map(async (period, i) => {
        const isCurrent = i === periods.length - 1;
        const asOf = isCurrent ? now : new Date(period.year, period.month, 0, 23, 59, 59, 999);
        const snapshot = await getHeadcountSnapshot(propertyId, asOf);
        return { ...period, totalPeople: snapshot.totalPeople };
      }),
    );
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

  // Last `count` periods, oldest first — feeds the dashboard maintenance &
  // incident trend chart. Mirrors getRevenueTrend's rolling-window shape
  // rather than getYearlyOperationalFrequency's fixed Jan–Dec year, so the
  // dashboard always shows "the last 6 months" regardless of current month.
  async getMaintenanceIncidentTrend(count = 6, propertyId?: string) {
    const now = new Date();
    const periods = Array.from({ length: count }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    return Promise.all(
      periods.map(async (period) => {
        const start = new Date(period.year, period.month - 1, 1);
        const end = new Date(period.year, period.month, 1);
        const [maintenanceCount, incidentCount] = await Promise.all([
          prisma.maintenanceRecord.count({
            where: { date: { gte: start, lt: end }, propertyId: propertyId || undefined },
          }),
          prisma.incident.count({
            where: { date: { gte: start, lt: end }, propertyId: propertyId || undefined },
          }),
        ]);
        return { ...period, maintenanceCount, incidentCount };
      }),
    );
  },

  async getCostBreakdown(propertyId?: string, targetDate = new Date()): Promise<CostBreakdownComparison> {
    const prevDate = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1);
    const [current, previous] = await Promise.all([
      getMonthCostBreakdown(propertyId, targetDate),
      getMonthCostBreakdown(propertyId, prevDate),
    ]);
    return { current, previous };
  },

  async getYearlyOperationalFrequency(propertyId?: string, targetYear = new Date().getFullYear()): Promise<YearlyOpsFrequencyResult> {
    const totalRooms = await prisma.room.count({
      where: { ...recordStatusWhere('active'), propertyId: propertyId || undefined },
    });

    const months: MonthlyOpsFrequency[] = [];
    for (let m = 1; m <= 12; m++) {
      const start = new Date(targetYear, m - 1, 1);
      const end = new Date(targetYear, m, 1);

      const [maintenanceCount, incidentCount] = await Promise.all([
        prisma.maintenanceRecord.count({
          where: {
            date: { gte: start, lt: end },
            propertyId: propertyId || undefined,
          },
        }),
        prisma.incident.count({
          where: {
            date: { gte: start, lt: end },
            propertyId: propertyId || undefined,
          },
        }),
      ]);

      const avgEventsPerRoom =
        totalRooms > 0 ? Math.round(((maintenanceCount + incidentCount) / totalRooms) * 10) / 10 : 0;

      months.push({
        month: m,
        year: targetYear,
        maintenanceCount,
        incidentCount,
        avgEventsPerRoom,
      });
    }

    let busiestMaintenanceMonth = 1;
    let maxMaint = -1;
    let busiestIncidentMonth = 1;
    let maxInc = -1;

    for (const mo of months) {
      if (mo.maintenanceCount > maxMaint) {
        maxMaint = mo.maintenanceCount;
        busiestMaintenanceMonth = mo.month;
      }
      if (mo.incidentCount > maxInc) {
        maxInc = mo.incidentCount;
        busiestIncidentMonth = mo.month;
      }
    }

    return {
      year: targetYear,
      totalRooms,
      months,
      busiestMaintenanceMonth,
      busiestIncidentMonth,
    };
  },

  async getOperationalSchedule(
    propertyId?: string,
    targetMonth = new Date().getMonth() + 1,
    targetYear = new Date().getFullYear(),
  ): Promise<{
    month: number;
    year: number;
    events: ScheduleEvent[];
  }> {
    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [payments, maintenanceRecords, endingContracts] = await Promise.all([
      prisma.payment.findMany({
        where: {
          dueDate: { gte: start, lt: end },
          contract: propertyId ? { room: { propertyId } } : undefined,
        },
        include: {
          contract: {
            include: {
              tenant: true,
              room: true,
            },
          },
        },
      }),
      prisma.maintenanceRecord.findMany({
        where: {
          date: { gte: start, lt: end },
          propertyId: propertyId || undefined,
        },
        include: {
          room: true,
        },
      }),
      prisma.contract.findMany({
        where: {
          endDate: { gte: start, lt: end },
          status: 'ACTIVE',
          ...(propertyId ? { room: { propertyId } } : {}),
        },
        include: {
          tenant: true,
          room: true,
        },
      }),
    ]);

    const events: ScheduleEvent[] = [];

    for (const p of payments) {
      const due = new Date(p.dueDate);
      due.setHours(0, 0, 0, 0);
      const isPaid = p.amountPaid.toNumber() >= p.amountDue.toNumber();
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let type: ScheduleEventType = 'PAYMENT_UPCOMING';
      let statusLabel = 'Belum Jatuh Tempo';

      if (isPaid) {
        type = 'PAYMENT_PAID';
        statusLabel = 'Lunas';
      } else if (diffDays < 0) {
        type = 'PAYMENT_OVERDUE';
        statusLabel = `Telat ${Math.abs(diffDays)} hari`;
      } else if (diffDays <= 7) {
        type = 'PAYMENT_DUE_SOON';
        statusLabel = diffDays === 0 ? 'Jatuh tempo hari ini' : `${diffDays} hari lagi jatuh tempo`;
      }

      events.push({
        id: `payment-${p.id}`,
        type,
        date: p.dueDate,
        dateStr: p.dueDate.toISOString().split('T')[0] ?? '',
        title: `Tagihan Sewa Kamar ${p.contract.room.number}`,
        roomNumber: p.contract.room.number,
        tenantName: p.contract.tenant.fullName,
        tenantPhone: p.contract.tenant.phone,
        amount: p.amountDue.toNumber() - p.amountPaid.toNumber(),
        description: `Tagihan periode ${p.periodMonth}/${p.periodYear}`,
        statusLabel,
      });
    }

    for (const m of maintenanceRecords) {
      events.push({
        id: `maintenance-${m.id}`,
        type: 'MAINTENANCE',
        date: m.date,
        dateStr: m.date.toISOString().split('T')[0] ?? '',
        title: `Maintenance: ${m.category}`,
        roomNumber: m.room?.number ?? 'Gedung',
        amount: m.cost?.toNumber() ?? undefined,
        description: m.notes ?? (m.vendor ? `Vendor: ${m.vendor}` : undefined),
        statusLabel: 'Jadwal Servis Rutin',
      });
    }

    for (const c of endingContracts) {
      if (!c.endDate) continue;
      events.push({
        id: `contract-${c.id}`,
        type: 'CONTRACT_END',
        date: c.endDate,
        dateStr: c.endDate.toISOString().split('T')[0] ?? '',
        title: `Masa Sewa Berakhir - Kamar ${c.room.number}`,
        roomNumber: c.room.number,
        tenantName: c.tenant.fullName,
        tenantPhone: c.tenant.phone,
        description: `Persiapan serah terima kunci & inventaris (${c.contractCode})`,
        statusLabel: 'Sewa Berakhir',
      });
    }

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      month: targetMonth,
      year: targetYear,
      events,
    };
  },

  async getQuarterlyFinancialSummary(
    propertyId?: string,
    targetYear = new Date().getFullYear(),
  ): Promise<QuarterlyFinancialSummary> {
    const start = new Date(targetYear, 0, 1);
    const end = new Date(targetYear + 1, 0, 1);
    const now = new Date();
    const isThisYear = now.getFullYear() === targetYear;
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentMonth = now.getMonth();

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    const [payments, expenses, maintenance] = await Promise.all([
      prisma.payment.findMany({
        where: {
          dueDate: { gte: start, lt: end },
          contract: propertyId ? { room: { propertyId } } : undefined,
        },
        select: { dueDate: true, amountPaid: true },
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: start, lt: end },
          propertyId: propertyId || undefined,
        },
        select: { date: true, amount: true },
      }),
      prisma.maintenanceRecord.findMany({
        where: {
          date: { gte: start, lt: end },
          propertyId: propertyId || undefined,
        },
        select: { date: true, cost: true },
      }),
    ]);

    const revenueByMonth = new Array(12).fill(0);
    const costByMonth = new Array(12).fill(0);

    for (const p of payments) {
      const m = p.dueDate.getMonth();
      if (m >= 0 && m < 12) {
        revenueByMonth[m] += p.amountPaid.toNumber();
      }
    }

    for (const e of expenses) {
      const m = e.date.getMonth();
      if (m >= 0 && m < 12) {
        costByMonth[m] += e.amount.toNumber();
      }
    }

    for (const mRecord of maintenance) {
      const m = mRecord.date.getMonth();
      if (m >= 0 && m < 12) {
        costByMonth[m] += mRecord.cost?.toNumber() ?? 0;
      }
    }

    const quarterLabels = [
      'Q1 (Jan - Mar)',
      'Q2 (Apr - Jun)',
      'Q3 (Jul - Sep)',
      'Q4 (Okt - Des)',
    ];

    const quarters: QuarterSummary[] = [1, 2, 3, 4].map((q) => {
      const mStart = (q - 1) * 3;
      const qRevenue =
        (revenueByMonth[mStart] ?? 0) +
        (revenueByMonth[mStart + 1] ?? 0) +
        (revenueByMonth[mStart + 2] ?? 0);
      const qCost =
        (costByMonth[mStart] ?? 0) +
        (costByMonth[mStart + 1] ?? 0) +
        (costByMonth[mStart + 2] ?? 0);
      const qProfit = qRevenue - qCost;
      const isCurQ = isThisYear && currentQuarter === q;

      const qMargin =
        qRevenue > 0 ? Math.round(((qRevenue - qCost) / qRevenue) * 1000) / 10 : null;

      let curContribution: QuarterSummary['currentMonthContribution'] = undefined;
      if (isCurQ) {
        const curMRev = revenueByMonth[currentMonth] ?? 0;
        const curMCost = costByMonth[currentMonth] ?? 0;
        curContribution = {
          month: currentMonth + 1,
          monthName: monthNames[currentMonth] ?? '',
          revenue: curMRev,
          cost: curMCost,
          revenueSharePercent:
            qRevenue > 0 ? Math.round((curMRev / qRevenue) * 1000) / 10 : null,
        };
      }

      return {
        quarter: q,
        label: quarterLabels[q - 1] ?? `Q${q}`,
        revenue: qRevenue,
        revenueMio: Math.round((qRevenue / 1_000_000) * 10) / 10,
        cost: qCost,
        costMio: Math.round((qCost / 1_000_000) * 10) / 10,
        netProfit: qProfit,
        netProfitMio: Math.round((qProfit / 1_000_000) * 10) / 10,
        netMarginPercent: qMargin,
        isCurrentQuarter: isCurQ,
        currentMonthContribution: curContribution,
      };
    });

    const totalRevenueYear = quarters.reduce((s, q) => s + q.revenue, 0);
    const totalCostYear = quarters.reduce((s, q) => s + q.cost, 0);
    const totalProfitYear = totalRevenueYear - totalCostYear;
    const totalMarginYearPercent =
      totalRevenueYear > 0
        ? Math.round(((totalRevenueYear - totalCostYear) / totalRevenueYear) * 1000) / 10
        : null;

    return {
      year: targetYear,
      currentQuarter,
      quarters,
      totalRevenueYear,
      totalRevenueYearMio: Math.round((totalRevenueYear / 1_000_000) * 10) / 10,
      totalCostYear,
      totalCostYearMio: Math.round((totalCostYear / 1_000_000) * 10) / 10,
      totalProfitYear,
      totalProfitYearMio: Math.round((totalProfitYear / 1_000_000) * 10) / 10,
      totalMarginYearPercent,
    };
  },

  async getRoomYieldOutliers(propertyId?: string): Promise<RoomYieldOutliersResult> {
    const end = new Date();
    const start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());

    const periodLabel = `${start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;

    const rooms = await prisma.room.findMany({
      where: {
        ...recordStatusWhere('active'),
        propertyId: propertyId || undefined,
      },
      include: {
        roomType: true,
      },
    });

    if (rooms.length === 0) {
      return {
        periodLabel,
        topRevenue: null,
        lowestRevenue: null,
        highestMaintenance: null,
        lowestMaintenance: null,
      };
    }

    const roomIds = rooms.map((r) => r.id);

    const [payments, maintenanceRecords, contracts] = await Promise.all([
      prisma.payment.findMany({
        where: {
          dueDate: { gte: start, lte: end },
          contract: {
            roomId: { in: roomIds },
          },
        },
        select: {
          amountPaid: true,
          contract: {
            select: { roomId: true },
          },
        },
      }),
      prisma.maintenanceRecord.findMany({
        where: {
          date: { gte: start, lte: end },
          roomId: { in: roomIds },
        },
        select: {
          roomId: true,
          cost: true,
          category: true,
        },
      }),
      prisma.contract.findMany({
        where: {
          roomId: { in: roomIds },
          status: { not: 'CANCELLED' },
          startDate: { lte: end },
          OR: [{ actualEndDate: null }, { actualEndDate: { gte: start } }],
        },
        select: {
          roomId: true,
          startDate: true,
          actualEndDate: true,
          endDate: true,
        },
      }),
    ]);

    const revenueMap = new Map<string, number>();
    for (const r of rooms) revenueMap.set(r.id, 0);
    for (const p of payments) {
      const rid = p.contract.roomId;
      const current = revenueMap.get(rid) ?? 0;
      revenueMap.set(rid, current + p.amountPaid.toNumber());
    }

    const maintenanceMap = new Map<string, { total: number; categories: string[] }>();
    for (const r of rooms) maintenanceMap.set(r.id, { total: 0, categories: [] });
    for (const m of maintenanceRecords) {
      if (!m.roomId) continue;
      const entry = maintenanceMap.get(m.roomId);
      if (entry) {
        entry.total += m.cost?.toNumber() ?? 0;
        if (!entry.categories.includes(m.category)) {
          entry.categories.push(m.category);
        }
      }
    }

    const occupancyDaysMap = new Map<string, number>();
    for (const r of rooms) occupancyDaysMap.set(r.id, 0);
    for (const c of contracts) {
      const cStart = c.startDate > start ? c.startDate : start;
      const cEffectiveEnd = c.actualEndDate ?? c.endDate ?? end;
      const cEnd = cEffectiveEnd < end ? cEffectiveEnd : end;
      if (cEnd > cStart) {
        const days = Math.round((cEnd.getTime() - cStart.getTime()) / (1000 * 60 * 60 * 24));
        const current = occupancyDaysMap.get(c.roomId) ?? 0;
        occupancyDaysMap.set(c.roomId, current + days);
      }
    }

    const firstRoom = rooms[0];
    if (!firstRoom) {
      return {
        periodLabel,
        topRevenue: null,
        lowestRevenue: null,
        highestMaintenance: null,
        lowestMaintenance: null,
      };
    }

    let topRevRoom = firstRoom;
    let maxRev = -1;
    let lowestRevRoom = firstRoom;
    let minRev = Infinity;

    let highestMaintRoom = firstRoom;
    let maxMaint = -1;
    let lowestMaintRoom = firstRoom;
    let minMaint = Infinity;

    for (const room of rooms) {
      const rev = revenueMap.get(room.id) ?? 0;
      if (rev > maxRev) {
        maxRev = rev;
        topRevRoom = room;
      }
      if (rev < minRev) {
        minRev = rev;
        lowestRevRoom = room;
      }

      const maint = maintenanceMap.get(room.id)?.total ?? 0;
      if (maint > maxMaint) {
        maxMaint = maint;
        highestMaintRoom = room;
      }
      if (maint < minMaint) {
        minMaint = maint;
        lowestMaintRoom = room;
      }
    }

    const topRevDays = occupancyDaysMap.get(topRevRoom.id) ?? 0;
    const lowestRevDays = occupancyDaysMap.get(lowestRevRoom.id) ?? 0;
    const highestMaintCats = maintenanceMap.get(highestMaintRoom.id)?.categories ?? [];
    const lowestMaintCats = maintenanceMap.get(lowestMaintRoom.id)?.categories ?? [];

    const toMio = (val: number) => Math.round((val / 1_000_000) * 10) / 10;

    const vacancyNote = lowestRevDays >= 330 ? 'Okupansi aktif' : 'Turnover/Kosong';

    return {
      periodLabel,
      topRevenue: {
        roomId: topRevRoom.id,
        roomNumber: topRevRoom.number,
        amount: Math.max(0, maxRev),
        amountMio: toMio(Math.max(0, maxRev)),
        meta: `Okupansi ~${Math.min(365, topRevDays)} hari • Tipe ${topRevRoom.roomType?.name ?? 'Standard'}`,
        roomType: topRevRoom.roomType?.name,
      },
      lowestRevenue: {
        roomId: lowestRevRoom.id,
        roomNumber: lowestRevRoom.number,
        amount: minRev === Infinity ? 0 : minRev,
        amountMio: toMio(minRev === Infinity ? 0 : minRev),
        meta: `Okupansi ~${Math.min(365, lowestRevDays)} hari (${vacancyNote}) • Tipe ${lowestRevRoom.roomType?.name ?? 'Standard'}`,
        roomType: lowestRevRoom.roomType?.name,
      },
      highestMaintenance: {
        roomId: highestMaintRoom.id,
        roomNumber: highestMaintRoom.number,
        amount: Math.max(0, maxMaint),
        amountMio: toMio(Math.max(0, maxMaint)),
        meta:
          highestMaintCats.length > 0
            ? `Servis: ${highestMaintCats.slice(0, 2).join(', ')}`
            : maxMaint > 0
            ? 'Servis berkala'
            : 'Tidak ada riwayat perbaikan',
        roomType: highestMaintRoom.roomType?.name,
      },
      lowestMaintenance: {
        roomId: lowestMaintRoom.id,
        roomNumber: lowestMaintRoom.number,
        amount: minMaint === Infinity ? 0 : minMaint,
        amountMio: toMio(minMaint === Infinity ? 0 : minMaint),
        meta:
          minMaint === 0 || minMaint === Infinity
            ? 'Bebas perbaikan 12 bulan terakhir'
            : `Servis minim: ${lowestMaintCats.slice(0, 2).join(', ') || 'Minor'}`,
        roomType: lowestMaintRoom.roomType?.name,
      },
    };
  },
};

export interface QuarterSummary {
  quarter: number;
  label: string;
  revenue: number;
  revenueMio: number;
  cost: number;
  costMio: number;
  netProfit: number;
  netProfitMio: number;
  netMarginPercent: number | null;
  isCurrentQuarter: boolean;
  currentMonthContribution?: {
    month: number;
    monthName: string;
    revenue: number;
    cost: number;
    revenueSharePercent: number | null;
  };
}

export interface QuarterlyFinancialSummary {
  year: number;
  currentQuarter: number;
  quarters: QuarterSummary[];
  totalRevenueYear: number;
  totalRevenueYearMio: number;
  totalCostYear: number;
  totalCostYearMio: number;
  totalProfitYear: number;
  totalProfitYearMio: number;
  totalMarginYearPercent: number | null;
}

export interface RoomOutlier {
  roomId: string;
  roomNumber: string;
  amount: number;
  amountMio: number;
  meta: string;
  roomType?: string;
}

export interface RoomYieldOutliersResult {
  periodLabel: string;
  topRevenue: RoomOutlier | null;
  lowestRevenue: RoomOutlier | null;
  highestMaintenance: RoomOutlier | null;
  lowestMaintenance: RoomOutlier | null;
}

export type ScheduleEventType =
  | 'PAYMENT_PAID'
  | 'PAYMENT_DUE_SOON'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_UPCOMING'
  | 'MAINTENANCE'
  | 'CONTRACT_END';

export interface ScheduleEvent {
  id: string;
  type: ScheduleEventType;
  date: Date;
  dateStr: string;
  title: string;
  roomNumber: string;
  tenantName?: string;
  tenantPhone?: string;
  amount?: number;
  description?: string;
  statusLabel: string;
}

export interface MonthlyOpsFrequency {
  month: number;
  year: number;
  maintenanceCount: number;
  incidentCount: number;
  avgEventsPerRoom: number;
}

export interface YearlyOpsFrequencyResult {
  year: number;
  totalRooms: number;
  months: MonthlyOpsFrequency[];
  busiestMaintenanceMonth: number;
  busiestIncidentMonth: number;
}

export interface CostBreakdownItem {
  category: string;
  label: string;
  amount: number;
  percentage: number;
}

export interface MonthCostBreakdown {
  month: number;
  year: number;
  totalCost: number;
  items: CostBreakdownItem[];
}

export interface CostBreakdownComparison {
  current: MonthCostBreakdown;
  previous: MonthCostBreakdown;
}

async function getMonthCostBreakdown(
  propertyId: string | undefined,
  date: Date,
): Promise<MonthCostBreakdown> {
  const { start, end } = monthRange(date);

  const [expenses, maintenanceAgg] = await Promise.all([
    prisma.expense.findMany({
      where: {
        date: { gte: start, lt: end },
        propertyId: propertyId || undefined,
      },
      select: { category: true, amount: true },
    }),
    prisma.maintenanceRecord.aggregate({
      where: {
        date: { gte: start, lt: end },
        propertyId: propertyId || undefined,
      },
      _sum: { cost: true },
    }),
  ]);

  const map = new Map<string, { label: string; amount: number }>();
  map.set('WIFI_INTERNET', { label: 'WiFi / Internet', amount: 0 });
  map.set('ELECTRICITY', { label: 'Listrik / Token PLN', amount: 0 });
  map.set('WATER', { label: 'Air / PDAM', amount: 0 });
  map.set('CLEANING', { label: 'Kebersihan & Sampah', amount: 0 });
  map.set('MAINTENANCE', { label: 'Perawatan & Perbaikan', amount: maintenanceAgg._sum.cost?.toNumber() ?? 0 });
  map.set('STAFF_SALARY', { label: 'Gaji Staf / ART', amount: 0 });
  map.set('OTHER', { label: 'Lain-lain & Operasional', amount: 0 });

  const addAmount = (key: string, amt: number) => {
    const entry = map.get(key);
    if (entry) entry.amount += amt;
  };

  for (const e of expenses) {
    const amt = e.amount.toNumber();
    if (e.category === 'WIFI_INTERNET') {
      addAmount('WIFI_INTERNET', amt);
    } else if (e.category === 'ELECTRICITY') {
      addAmount('ELECTRICITY', amt);
    } else if (e.category === 'WATER') {
      addAmount('WATER', amt);
    } else if (e.category === 'CLEANING' || e.category === 'WASTE_MANAGEMENT') {
      addAmount('CLEANING', amt);
    } else if (e.category === 'STAFF_SALARY') {
      addAmount('STAFF_SALARY', amt);
    } else if (e.category === 'RENOVATION') {
      addAmount('MAINTENANCE', amt);
    } else {
      addAmount('OTHER', amt);
    }
  }

  const rawItems = Array.from(map.entries())
    .map(([category, { label, amount }]) => ({ category, label, amount }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalCost = rawItems.reduce((sum, item) => sum + item.amount, 0);

  let items: CostBreakdownItem[] = [];
  if (totalCost > 0) {
    let sumPct = 0;
    items = rawItems.map((item, index) => {
      if (index === rawItems.length - 1) {
        const pct = Math.max(0, Math.round((100 - sumPct) * 10) / 10);
        return { ...item, percentage: pct };
      }
      const pct = Math.round((item.amount / totalCost) * 1000) / 10;
      sumPct += pct;
      return { ...item, percentage: pct };
    });
  }

  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    totalCost,
    items,
  };
}
