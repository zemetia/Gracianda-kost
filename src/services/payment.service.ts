// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { prisma } from '@/lib/prisma';
import type { Payment } from '@prisma/client';
import type { AddPartialPaymentInput } from '@/lib/validations';

export type PaymentStatus = 'PENDING' | 'DUE' | 'OVERDUE' | 'PAID';

const DUE_DAY_OF_MONTH = 5;

function stripTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Pure status derivation — never stored, so a missed cron run can't leave a
 * payment showing a stale status. `today` is a parameter (not `new Date()`
 * internally) so this stays trivially testable.
 */
export function getPaymentStatus(
  payment: Pick<Payment, 'amountDue' | 'amountPaid' | 'dueDate'>,
  today: Date = new Date(),
): PaymentStatus {
  const amountDue = Number(payment.amountDue);
  const amountPaid = Number(payment.amountPaid);
  if (amountPaid >= amountDue) return 'PAID';

  const due = stripTime(payment.dueDate);
  const now = stripTime(today);
  if (now < due) return 'PENDING';
  if (now === due) return 'DUE';
  return 'OVERDUE';
}

export const paymentService = {
  list() {
    return prisma.payment.findMany({
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { dueDate: 'asc' }],
      include: { contract: { include: { tenant: true, room: { include: { floor: true } } } } },
    });
  },

  getById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: { contract: { include: { tenant: true, room: { include: { floor: true } } } } },
    });
  },

  listByContract(contractId: string) {
    return prisma.payment.findMany({
      where: { contractId },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  },

  /**
   * Creates one Payment per ACTIVE contract for the given period. Relies on
   * `@@unique([contractId, periodMonth, periodYear])` + `skipDuplicates` to
   * stay idempotent — safe to click "Generate Tagihan Bulan Ini" more than
   * once, or to re-run a cron for the same month.
   */
  async generateMonthlyInvoices(periodMonth: number, periodYear: number) {
    const activeContracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, rentPrice: true },
    });
    if (activeContracts.length === 0) return { created: 0 };

    const dueDate = new Date(periodYear, periodMonth - 1, DUE_DAY_OF_MONTH);

    const result = await prisma.payment.createMany({
      data: activeContracts.map((contract) => ({
        contractId: contract.id,
        periodMonth,
        periodYear,
        amountDue: contract.rentPrice,
        dueDate,
      })),
      skipDuplicates: true,
    });

    return { created: result.count };
  },

  async markAsPaid(id: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id } });
    return prisma.payment.update({
      where: { id },
      data: { amountPaid: payment.amountDue, paidAt: new Date() },
    });
  },

  addPartialPayment(id: string, input: AddPartialPaymentInput) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({ where: { id } });
      const amountPaid = Number(payment.amountPaid) + input.amount;
      const amountDue = Number(payment.amountDue);

      return tx.payment.update({
        where: { id },
        data: {
          amountPaid,
          method: input.method,
          note: input.note,
          paidAt: amountPaid >= amountDue ? new Date() : payment.paidAt,
        },
      });
    });
  },
};
