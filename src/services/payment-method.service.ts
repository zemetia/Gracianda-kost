// Server-only: Prisma-backed domain service.
import { prisma } from '@/lib/prisma';
import type { PaymentMethodInput } from '@/lib/validations';

export const paymentMethodService = {
  list() {
    return prisma.paymentMethod.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  },

  listActive() {
    return prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  },

  create(data: PaymentMethodInput) {
    return prisma.paymentMethod.create({ data });
  },

  update(id: string, data: PaymentMethodInput) {
    return prisma.paymentMethod.update({ where: { id }, data });
  },

  // Soft-delete: Payment historis mereferensikannya, hard-delete akan
  // menghapus jejak transaksi.
  deactivate(id: string) {
    return prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
