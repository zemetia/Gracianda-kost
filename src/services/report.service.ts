// Server-only: Prisma-backed aggregate service for /admin/reports/*.
// Every report is a query-time aggregate, not a stored table — see
// docs/plan/02-modules-features.md §9.

import { prisma } from '@/lib/prisma';
import type {
  ExpenseCategory,
  IncidentCategory,
  IncidentStatus,
  MaintenanceScope,
  PaymentMethodType,
  Prisma,
} from '@/generated/prisma/client';
import { expenseCategoryLabel } from '@/lib/expense';

import { getPaymentStatus } from './payment.service';

export interface ReportFilter {
  from?: Date;
  to?: Date;
  propertyId?: string;
  floorId?: string;
  roomId?: string;
}

function roomScopeWhere(filter: ReportFilter): Prisma.RoomWhereInput | undefined {
  if (filter.roomId) return { id: filter.roomId };
  if (filter.floorId) return { floorId: filter.floorId };
  if (filter.propertyId) return { propertyId: filter.propertyId };
  return undefined;
}

export const reportService = {
  async financial(filter: ReportFilter = {}) {
    const roomWhere = roomScopeWhere(filter);

    const payments = await prisma.payment.findMany({
      where: {
        ...(filter.from || filter.to
          ? { dueDate: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
          : {}),
        ...(roomWhere && { contract: { room: roomWhere } }),
      },
      select: { amountPaid: true, contract: { select: { room: { select: { id: true, number: true } } } } },
    });

    const maintenance = await prisma.maintenanceRecord.findMany({
      where: {
        ...(filter.from || filter.to
          ? { date: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
          : {}),
        ...(filter.propertyId && { propertyId: filter.propertyId }),
        ...(!filter.propertyId && roomWhere && { room: roomWhere }),
      },
      select: { cost: true, room: { select: { id: true, number: true } } },
    });

    // Operating expenses (listrik, wifi, gaji staf, dll) — property-scoped
    // only, never room-scoped, so drilling into a single kamar/lantai still
    // shows the full property-wide expense total rather than zero.
    const expenses = await prisma.expense.findMany({
      where: {
        ...(filter.from || filter.to
          ? { date: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
          : {}),
        ...(filter.propertyId && { propertyId: filter.propertyId }),
      },
      select: { category: true, amount: true },
    });

    // Deposit is tenant money held in trust, not rental income — kept out of
    // totalRevenue/profit and reported as its own cash-flow line so "laba"
    // never gets inflated by money that has to be handed back at check-out.
    // Received uses Contract.startDate (no separate receipt-date field yet);
    // returned uses actualEndDate, set by contractService.checkout().
    const depositDateFilter = (field: 'startDate' | 'actualEndDate') =>
      filter.from || filter.to
        ? { [field]: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
        : {};

    const [depositReceivedContracts, depositReturnedContracts] = await Promise.all([
      prisma.contract.findMany({
        where: {
          deposit: { not: null },
          ...depositDateFilter('startDate'),
          ...(roomWhere && { room: roomWhere }),
        },
        select: { deposit: true },
      }),
      prisma.contract.findMany({
        where: {
          depositRefunded: { not: null },
          ...depositDateFilter('actualEndDate'),
          ...(roomWhere && { room: roomWhere }),
        },
        select: { depositRefunded: true },
      }),
    ]);

    const depositReceived = depositReceivedContracts.reduce((sum, c) => sum + (c.deposit?.toNumber() ?? 0), 0);
    const depositReturned = depositReturnedContracts.reduce(
      (sum, c) => sum + (c.depositRefunded?.toNumber() ?? 0),
      0,
    );

    const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid.toNumber(), 0);
    const maintenanceCost = maintenance.reduce((sum, m) => sum + (m.cost?.toNumber() ?? 0), 0);
    const expenseCost = expenses.reduce((sum, e) => sum + e.amount.toNumber(), 0);
    const totalCost = maintenanceCost + expenseCost;

    const expenseByCategoryMap = new Map<ExpenseCategory, number>();
    for (const e of expenses) {
      expenseByCategoryMap.set(e.category, (expenseByCategoryMap.get(e.category) ?? 0) + e.amount.toNumber());
    }
    const expenseByCategory = Array.from(expenseByCategoryMap.entries())
      .map(([category, total]) => ({ category, label: expenseCategoryLabel(category), total }))
      .sort((a, b) => b.total - a.total);

    const byRoom = new Map<string, { roomNumber: string; revenue: number; cost: number }>();
    for (const p of payments) {
      const room = p.contract.room;
      const entry = byRoom.get(room.id) ?? { roomNumber: room.number, revenue: 0, cost: 0 };
      entry.revenue += p.amountPaid.toNumber();
      byRoom.set(room.id, entry);
    }
    for (const m of maintenance) {
      if (!m.room) continue;
      const entry = byRoom.get(m.room.id) ?? { roomNumber: m.room.number, revenue: 0, cost: 0 };
      entry.cost += m.cost?.toNumber() ?? 0;
      byRoom.set(m.room.id, entry);
    }

    return {
      totalRevenue,
      totalCost,
      maintenanceCost,
      expenseCost,
      profit: totalRevenue - totalCost,
      depositReceived,
      depositReturned,
      netDeposit: depositReceived - depositReturned,
      byRoom: Array.from(byRoom.values()).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
      expenseByCategory,
    };
  },

  /**
   * Cash received per payment method for a period — used to reconcile
   * physical cash and each bank account against what the system expects.
   * Filters by `paidAt` (when money actually came in), not `dueDate` like
   * `financial()`.
   */
  async cash(filter: ReportFilter = {}) {
    const roomWhere = roomScopeWhere(filter);

    const payments = await prisma.payment.findMany({
      where: {
        amountPaid: { gt: 0 },
        ...(filter.from || filter.to
          ? { paidAt: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
          : {}),
        ...(roomWhere && { contract: { room: roomWhere } }),
      },
      select: {
        amountPaid: true,
        paymentMethod: { select: { id: true, name: true, type: true } },
      },
    });

    const byMethod = new Map<
      string,
      { methodId: string | null; name: string; type: PaymentMethodType | null; total: number; count: number }
    >();
    for (const p of payments) {
      const key = p.paymentMethod?.id ?? 'UNKNOWN';
      const entry =
        byMethod.get(key) ??
        {
          methodId: p.paymentMethod?.id ?? null,
          name: p.paymentMethod?.name ?? 'Belum dipilih metode',
          type: p.paymentMethod?.type ?? null,
          total: 0,
          count: 0,
        };
      entry.total += p.amountPaid.toNumber();
      entry.count += 1;
      byMethod.set(key, entry);
    }

    return {
      totalReceived: payments.reduce((sum, p) => sum + p.amountPaid.toNumber(), 0),
      byMethod: Array.from(byMethod.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
  },

  async tenants(filter: ReportFilter = {}) {
    const roomWhere = roomScopeWhere(filter);
    const contractRoomFilter: Prisma.ContractWhereInput = roomWhere ? { room: roomWhere } : {};
    const periodFilter =
      filter.from || filter.to
        ? { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) }
        : undefined;

    const [active, endedThisPeriod, newThisPeriod, blacklisted, overduePayments] = await Promise.all([
      prisma.contract.count({ where: { ...contractRoomFilter, status: 'ACTIVE' } }),
      prisma.contract.count({
        where: { ...contractRoomFilter, status: 'ENDED', ...(periodFilter && { actualEndDate: periodFilter }) },
      }),
      prisma.contract.count({
        where: { ...contractRoomFilter, ...(periodFilter && { startDate: periodFilter }) },
      }),
      prisma.tenant.count({ where: { isBlacklisted: true } }),
      prisma.payment.findMany({
        where: { contract: contractRoomFilter },
        select: { amountDue: true, amountPaid: true, dueDate: true, contractId: true },
      }),
    ]);

    const today = new Date();
    const overdueContractIds = new Set(
      overduePayments.filter((p) => getPaymentStatus(p, today) === 'OVERDUE').map((p) => p.contractId),
    );

    return {
      active,
      endedThisPeriod,
      newThisPeriod,
      blacklisted,
      overdueCount: overdueContractIds.size,
    };
  },

  async maintenance(filter: ReportFilter & { scope?: MaintenanceScope } = {}) {
    const roomWhere = roomScopeWhere(filter);
    const records = await prisma.maintenanceRecord.findMany({
      where: {
        ...(filter.scope && { scope: filter.scope }),
        ...(filter.from || filter.to
          ? { date: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
          : {}),
        ...(filter.propertyId && { propertyId: filter.propertyId }),
        ...(!filter.propertyId && roomWhere && { room: roomWhere }),
      },
      include: { room: { include: { floor: true } } },
    });

    const byRoom = new Map<string, { roomNumber: string; count: number; totalCost: number }>();
    for (const record of records) {
      const key = record.room?.id ?? 'BUILDING';
      const label = record.room ? record.room.number : 'Gedung';
      const entry = byRoom.get(key) ?? { roomNumber: label, count: 0, totalCost: 0 };
      entry.count += 1;
      entry.totalCost += record.cost?.toNumber() ?? 0;
      byRoom.set(key, entry);
    }

    return {
      count: records.length,
      totalCost: records.reduce((sum, r) => sum + (r.cost?.toNumber() ?? 0), 0),
      byRoom: Array.from(byRoom.values()).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
    };
  },

  async incidents(filter: ReportFilter & { category?: IncidentCategory; status?: IncidentStatus } = {}) {
    const roomWhere = roomScopeWhere(filter);
    const incidents = await prisma.incident.findMany({
      where: {
        ...(filter.category && { category: filter.category }),
        ...(filter.status && { status: filter.status }),
        ...(filter.from || filter.to
          ? { date: { ...(filter.from && { gte: filter.from }), ...(filter.to && { lte: filter.to }) } }
          : {}),
        ...(filter.propertyId && { propertyId: filter.propertyId }),
        ...(!filter.propertyId && roomWhere && { room: roomWhere }),
      },
    });

    const byStatus: Record<IncidentStatus, number> = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    const byCategory: Partial<Record<IncidentCategory, number>> = {};
    for (const incident of incidents) {
      byStatus[incident.status] += 1;
      byCategory[incident.category] = (byCategory[incident.category] ?? 0) + 1;
    }

    return { total: incidents.length, byStatus, byCategory };
  },
};
