// Server-only: writes and reads AuditLog rows directly via Prisma.
// `log()` is called from Server Actions after a mutation succeeds — never from
// Client Components. The read side backs /admin/audit-log (SUPER_ADMIN only).

import { prisma } from '@/lib/prisma';
import type { AuditLogFilterInput } from '@/lib/validations';
import type { AuditAction, Prisma } from '@prisma/client';

interface LogParams {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

export const AUDIT_PAGE_SIZE = 50;

export const auditService = {
  log({ userId, action, entityType, entityId, before, after }: LogParams): Promise<void> {
    return prisma.auditLog
      .create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          before: before === undefined ? undefined : (before as object),
          after: after === undefined ? undefined : (after as object),
        },
      })
      .then(() => undefined);
  },

  async list(filter: AuditLogFilterInput) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filter.entityType ? { entityType: filter.entityType } : {}),
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.action ? { action: filter.action } : {}),
      ...(filter.from || filter.to
        ? {
            createdAt: {
              ...(filter.from ? { gte: filter.from } : {}),
              // `to` is a date-only input — include the whole day.
              ...(filter.to ? { lt: new Date(filter.to.getTime() + 24 * 60 * 60 * 1000) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * AUDIT_PAGE_SIZE,
        take: AUDIT_PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { rows, total, page: filter.page, pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
  },

  // Powers the entity filter dropdown — entityType is free-form text written by
  // each Server Action, so the option list is derived from the data itself.
  async entityTypes(): Promise<string[]> {
    const rows = await prisma.auditLog.findMany({
      distinct: ['entityType'],
      select: { entityType: true },
      orderBy: { entityType: 'asc' },
    });
    return rows.map((row) => row.entityType);
  },
};
