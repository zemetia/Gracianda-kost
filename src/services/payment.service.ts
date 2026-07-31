// Server-only: Prisma-backed domain service. Import only from Server
// Components, Server Actions, or Route Handlers — never from 'use client' files.

import { monthRange, periodsInRange } from '@/lib/billing';
import { electricityCharge, electricityModeLabel, isMetered } from '@/lib/electricity';
import { prisma } from '@/lib/prisma';
import type { Payment } from '@/generated/prisma/client';
import type { AddPartialPaymentInput, RecordElectricityInput } from '@/lib/validations';
import { settingService } from '@/services/setting.service';

export type PaymentStatus = 'PENDING' | 'DUE' | 'OVERDUE' | 'PAID';

export interface PaymentListFilter {
  propertyId?: string;
  month?: number;
  year?: number;
  /** Free-text match on contract code, tenant name/phone, or room number. */
  q?: string;
}

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

/**
 * Coarser grouping used by the payments board and the dashboard action queue.
 * Defined once here so "jatuh tempo ≤3 hari" means the same thing in both.
 */
export type PaymentBucket = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'PAID';

export const DUE_SOON_DAYS = 3;

const MS_PER_DAY = 86_400_000;

export function getPaymentBucket(
  payment: Pick<Payment, 'amountDue' | 'amountPaid' | 'dueDate'>,
  today: Date = new Date(),
): PaymentBucket {
  const status = getPaymentStatus(payment, today);
  if (status === 'PAID') return 'PAID';
  if (status === 'OVERDUE') return 'OVERDUE';

  const daysUntilDue = (stripTime(payment.dueDate) - stripTime(today)) / MS_PER_DAY;
  return daysUntilDue <= DUE_SOON_DAYS ? 'DUE_SOON' : 'UPCOMING';
}

export const paymentService = {
  list(filter: PaymentListFilter = {}) {
    const { propertyId, month, year, q } = filter;
    return prisma.payment.findMany({
      where: {
        periodMonth: month,
        periodYear: year,
        contract: {
          ...(propertyId ? { room: { propertyId } } : {}),
          ...(q
            ? {
                OR: [
                  { contractCode: { contains: q, mode: 'insensitive' as const } },
                  { tenant: { fullName: { contains: q, mode: 'insensitive' as const } } },
                  { tenant: { phone: { contains: q } } },
                  { room: { number: { contains: q, mode: 'insensitive' as const } } },
                ],
              }
            : {}),
        },
      },
      orderBy: [{ dueDate: 'asc' }],
      include: {
        contract: { include: { tenant: true, room: { include: { floor: true, property: true } } } },
        reminders: { orderBy: { sentAt: 'desc' }, take: 1 },
        paymentMethod: true,
      },
    });
  },

  getById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        contract: { include: { tenant: true, room: { include: { floor: true, property: true } } } },
        paymentMethod: true,
      },
    });
  },

  listByContract(contractId: string) {
    return prisma.payment.findMany({
      where: { contractId },
      orderBy: { periodStart: 'desc' },
      include: {
        reminders: { orderBy: { sentAt: 'desc' }, take: 1, include: { user: true } },
        paymentMethod: true,
      },
    });
  },

  /**
   * Every invoice a period should contain, whether or not it exists in the DB
   * yet. One row per billing period — a DAILY contract yields ~30 rows for a
   * month, a 3-monthly contract yields one every third month.
   */
  async planInvoices(periodMonth: number, periodYear: number, propertyId?: string) {
    const range = monthRange(periodMonth, periodYear);
    const activeContracts = await prisma.contract.findMany({
      where: { status: 'ACTIVE', ...(propertyId ? { room: { propertyId } } : {}) },
      select: {
        id: true,
        rentPrice: true,
        startDate: true,
        endDate: true,
        billingCycle: true,
        billingInterval: true,
      },
    });

    return activeContracts.flatMap((contract) =>
      periodsInRange(contract, range.start, range.end).map((period) => ({
        contractId: contract.id,
        periodStart: period.start,
        periodEnd: period.end,
        periodMonth: period.start.getMonth() + 1,
        periodYear: period.start.getFullYear(),
        // Electricity is added later, when the admin enters the meter reading —
        // at generation time rent is the whole invoice.
        rentAmount: contract.rentPrice,
        amountDue: contract.rentPrice,
        // Rent is due on the day the period opens — the tenant's own
        // anniversary date, not one global due day for the whole building.
        dueDate: period.start,
      })),
    );
  },

  /**
   * Creates the invoices for a calendar month. Idempotent via
   * `@@unique([contractId, periodStart])` + `skipDuplicates` — safe to click
   * "Generate Tagihan Bulan Ini" twice or to re-run a cron for the same month.
   */
  async generateMonthlyInvoices(periodMonth: number, periodYear: number, propertyId?: string) {
    const planned = await this.planInvoices(periodMonth, periodYear, propertyId);
    if (planned.length === 0) return { created: 0 };

    const result = await prisma.payment.createMany({ data: planned, skipDuplicates: true });
    return { created: result.count };
  },

  /**
   * How many invoices this period still lacks — drives the "tagihan belum
   * digenerate" item in the dashboard action queue, so the admin is told
   * instead of having to remember.
   */
  async countMissingInvoices(periodMonth: number, periodYear: number, propertyId?: string) {
    const planned = await this.planInvoices(periodMonth, periodYear, propertyId);
    if (planned.length === 0) return 0;

    const existing = await prisma.payment.findMany({
      where: {
        contractId: { in: [...new Set(planned.map((invoice) => invoice.contractId))] },
        periodStart: { in: planned.map((invoice) => invoice.periodStart) },
      },
      select: { contractId: true, periodStart: true },
    });
    const billed = new Set(
      existing.map((payment) => `${payment.contractId}:${payment.periodStart.getTime()}`),
    );

    return planned.filter(
      (invoice) => !billed.has(`${invoice.contractId}:${invoice.periodStart.getTime()}`),
    ).length;
  },

  /** Total still owed on a contract across every period — used at check-out. */
  async getOutstandingByContract(contractId: string): Promise<number> {
    const payments = await prisma.payment.findMany({
      where: { contractId },
      select: { amountDue: true, amountPaid: true },
    });
    return payments.reduce(
      (sum, payment) => sum + Math.max(Number(payment.amountDue) - Number(payment.amountPaid), 0),
      0,
    );
  },

  async markAsPaid(id: string, paymentMethodId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id } });
    return prisma.payment.update({
      where: { id },
      data: { amountPaid: payment.amountDue, paidAt: new Date(), paymentMethodId },
    });
  },

  /**
   * Records that an admin opened a reminder for this payment. The message
   * itself still goes out manually through wa.me — this only stops the same
   * tenant being chased twice in one day by two different admins.
   */
  logReminder(paymentId: string, userId: string, channel = 'WHATSAPP') {
    return prisma.paymentReminder.create({ data: { paymentId, userId, channel } });
  },

  /**
   * Records a meter reading on one invoice and re-prices it. Rejects rooms that
   * are not METERED — a FREE or TOKEN unit that suddenly carries a kWh line is
   * a data-entry mistake, not a charge the tenant agreed to.
   *
   * Re-entering a corrected reading is safe: amountDue is rebuilt from
   * rentAmount rather than accumulated, and the tariff is re-snapshotted.
   */
  async recordElectricity(id: string, input: RecordElectricityInput) {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id },
      include: { contract: { include: { room: true } } },
    });

    const mode = payment.contract.room.electricityMode;
    if (!isMetered(mode)) {
      throw new Error(
        `Kamar ini listriknya "${electricityModeLabel(mode)}" — tidak ditagih per kWh.`,
      );
    }

    const rate = await settingService.getElectricityTariff();
    const electricityAmount = electricityCharge(input.kwh, rate);
    const rentAmount = Number(payment.rentAmount);

    return prisma.payment.update({
      where: { id },
      data: {
        electricityKwh: input.kwh,
        electricityRate: rate,
        electricityAmount,
        amountDue: rentAmount + electricityAmount,
      },
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
          paymentMethodId: input.paymentMethodId,
          note: input.note,
          paidAt: amountPaid >= amountDue ? new Date() : payment.paidAt,
        },
      });
    });
  },
};
