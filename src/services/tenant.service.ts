// Server-only: Prisma-backed domain service.

import { prisma } from '@/lib/prisma';
import type { BlacklistInput, TenantInput } from '@/lib/validations';

export const tenantService = {
  list() {
    return prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  },

  // Autocomplete search by KTP, name, or phone — used when picking an
  // existing tenant for a new contract (sewa ulang / pindah kamar).
  search(query: string) {
    if (!query.trim()) return this.list();
    return prisma.tenant.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { ktpNumber: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },

  getById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: { room: { include: { floor: true } }, occupants: true },
        },
      },
    });
  },

  create(data: TenantInput) {
    return prisma.tenant.create({
      data: { ...data, email: data.email || null },
    });
  },

  update(id: string, data: TenantInput) {
    return prisma.tenant.update({
      where: { id },
      data: { ...data, email: data.email || null },
    });
  },

  setBlacklist(id: string, data: BlacklistInput) {
    return prisma.tenant.update({
      where: { id },
      data: { isBlacklisted: data.isBlacklisted, blacklistNote: data.blacklistNote },
    });
  },
};
