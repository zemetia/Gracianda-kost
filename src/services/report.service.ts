// Server-only: Prisma-backed aggregate service for /admin/reports/*.
// Every report is a query-time aggregate, not a stored table — see
// docs/plan/02-modules-features.md §9.

import { prisma } from '@/lib/prisma';
import type { IncidentCategory, IncidentStatus, MaintenanceScope, Prisma } from '@prisma/client';

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

    const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid.toNumber(), 0);
    const totalCost = maintenance.reduce((sum, m) => sum + (m.cost?.toNumber() ?? 0), 0);

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
      profit: totalRevenue - totalCost,
      byRoom: Array.from(byRoom.values()).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
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
