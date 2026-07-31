// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { prisma } from '@/lib/prisma';
import type { ExpenseCategory, Prisma } from '@/generated/prisma/client';
import type { ExpenseInput } from '@/lib/validations';

export interface ExpenseFilter {
  propertyId?: string;
  category?: ExpenseCategory;
  from?: Date;
  to?: Date;
}

export const expenseService = {
  list(filter: ExpenseFilter = {}) {
    const where: Prisma.ExpenseWhereInput = {};
    if (filter.propertyId) where.propertyId = filter.propertyId;
    if (filter.category) where.category = filter.category;
    if (filter.from || filter.to) {
      where.date = {
        ...(filter.from && { gte: filter.from }),
        ...(filter.to && { lte: filter.to }),
      };
    }

    return prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { property: true, createdBy: true },
    });
  },

  getById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: { property: true, createdBy: true },
    });
  },

  create(data: ExpenseInput & { createdByUserId: string }) {
    return prisma.expense.create({ data });
  },

  update(id: string, data: ExpenseInput) {
    return prisma.expense.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.expense.delete({ where: { id } });
  },

  /** Category totals for the financial report — property scoped only, no room dimension. */
  async summaryByCategory(filter: ExpenseFilter = {}): Promise<{ category: ExpenseCategory; total: number }[]> {
    const where: Prisma.ExpenseWhereInput = {};
    if (filter.propertyId) where.propertyId = filter.propertyId;
    if (filter.from || filter.to) {
      where.date = {
        ...(filter.from && { gte: filter.from }),
        ...(filter.to && { lte: filter.to }),
      };
    }

    const grouped = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    });

    return grouped
      .map((row) => ({ category: row.category, total: row._sum.amount?.toNumber() ?? 0 }))
      .sort((a, b) => b.total - a.total);
  },
};
