// Server-only: Prisma-backed domain service.

import { prisma } from '@/lib/prisma';
import type { MaintenanceScope, Prisma } from '@/generated/prisma/client';
import type { MaintenanceInput } from '@/lib/validations';

interface MaintenanceFilter {
  scope?: MaintenanceScope;
  propertyId?: string;
  roomId?: string;
  floorId?: string;
  from?: Date;
  to?: Date;
}

export const maintenanceService = {
  list(filter: MaintenanceFilter = {}) {
    const where: Prisma.MaintenanceRecordWhereInput = {};
    if (filter.scope) where.scope = filter.scope;
    if (filter.propertyId) where.propertyId = filter.propertyId;
    if (filter.roomId) where.roomId = filter.roomId;
    if (filter.floorId) where.room = { floorId: filter.floorId };
    if (filter.from || filter.to) {
      where.date = {
        ...(filter.from && { gte: filter.from }),
        ...(filter.to && { lte: filter.to }),
      };
    }

    return prisma.maintenanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { room: { include: { floor: true } }, property: true },
    });
  },

  getById(id: string) {
    return prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { room: { include: { floor: true } }, property: true },
    });
  },

  create(data: MaintenanceInput) {
    return prisma.maintenanceRecord.create({
      data: {
        ...data,
        roomId: data.scope === 'ROOM' ? data.roomId : null,
      },
    });
  },

  // Distinct categories already used, for the datalist suggestion in the form.
  async listCategories(): Promise<string[]> {
    const rows = await prisma.maintenanceRecord.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });
    return rows.map((r) => r.category);
  },
};
