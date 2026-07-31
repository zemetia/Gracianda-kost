// Server-only: Prisma-backed domain service.

import { prisma } from '@/lib/prisma';
import type { FacilityInput } from '@/lib/validations';

export const facilityService = {
  list() {
    return prisma.facility.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  },

  /** Facilities assignable to a room/room type — common-area facilities belong to the property, not a unit. */
  listAssignable() {
    return prisma.facility.findMany({ where: { category: 'ROOM' }, orderBy: { name: 'asc' } });
  },

  /** Adds how many rooms / room types reference the facility — deletion cascades to both. */
  listWithUsage() {
    return prisma.facility.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { rooms: true, roomTypes: true } } },
    });
  },

  create(data: FacilityInput) {
    return prisma.facility.create({ data });
  },

  update(id: string, data: FacilityInput) {
    return prisma.facility.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.facility.delete({ where: { id } });
  },
};
