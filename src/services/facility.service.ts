// Server-only: Prisma-backed domain service.

import { prisma } from '@/lib/prisma';
import type { FacilityInput } from '@/lib/validations';

export const facilityService = {
  list() {
    return prisma.facility.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
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
