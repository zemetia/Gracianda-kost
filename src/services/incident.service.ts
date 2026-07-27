// Server-only: Prisma-backed domain service.

import { prisma } from '@/lib/prisma';
import type { IncidentCategory, IncidentStatus, Prisma } from '@prisma/client';
import type { IncidentInput, IncidentStatusInput } from '@/lib/validations';

interface IncidentFilter {
  category?: IncidentCategory;
  status?: IncidentStatus;
  roomId?: string;
  floorId?: string;
}

export const incidentService = {
  list(filter: IncidentFilter = {}) {
    const where: Prisma.IncidentWhereInput = {};
    if (filter.category) where.category = filter.category;
    if (filter.status) where.status = filter.status;
    if (filter.roomId) where.roomId = filter.roomId;
    if (filter.floorId) where.room = { floorId: filter.floorId };

    return prisma.incident.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { room: { include: { floor: true } } },
    });
  },

  getById(id: string) {
    return prisma.incident.findUnique({
      where: { id },
      include: { room: { include: { floor: true } } },
    });
  },

  create(data: IncidentInput) {
    return prisma.incident.create({ data });
  },

  updateStatus(id: string, data: IncidentStatusInput) {
    return prisma.incident.update({ where: { id }, data });
  },
};
