// Server-only: Prisma-backed domain service.

import { prisma } from '@/lib/prisma';
import type { PromoInput } from '@/lib/validations';

export const promoService = {
  list() {
    return prisma.promo.findMany({ orderBy: { startDate: 'desc' } });
  },

  create(data: PromoInput) {
    return prisma.promo.create({ data });
  },

  update(id: string, data: PromoInput) {
    return prisma.promo.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.promo.delete({ where: { id } });
  },
};

export const publicPromoService = {
  listActive() {
    const now = new Date();
    return prisma.promo.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { startDate: 'desc' },
    });
  },
};
