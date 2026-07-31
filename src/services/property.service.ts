// Server-only: Prisma-backed domain service.
import { prisma } from '@/lib/prisma';
import type { PropertyInput } from '@/lib/validations';

export const propertyService = {
  list() {
    return prisma.property.findMany({
      orderBy: { name: 'asc' },
    });
  },

  listActive() {
    return prisma.property.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  getById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: { facilities: { include: { facility: true } } },
    });
  },

  create(data: PropertyInput) {
    const { facilityIds, ...rest } = data;

    return prisma.property.create({
      data: {
        ...rest,
        facilities: { create: facilityIds.map((facilityId) => ({ facilityId })) },
      },
    });
  },

  update(id: string, data: PropertyInput) {
    const { facilityIds, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      await tx.propertyFacility.deleteMany({ where: { propertyId: id } });

      return tx.property.update({
        where: { id },
        data: {
          ...rest,
          facilities: { create: facilityIds.map((facilityId) => ({ facilityId })) },
        },
      });
    });
  },

  deactivate(id: string) {
    return prisma.property.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
