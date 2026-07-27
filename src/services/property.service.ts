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
    });
  },

  create(data: PropertyInput) {
    return prisma.property.create({ data });
  },

  update(id: string, data: PropertyInput) {
    return prisma.property.update({
      where: { id },
      data,
    });
  },

  deactivate(id: string) {
    return prisma.property.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
