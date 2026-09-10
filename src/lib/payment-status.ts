// Pure functions for payment status and bucket classifications.
// Safe to import in both Server Components and Client Components.

export type PaymentStatus = 'PENDING' | 'DUE' | 'OVERDUE' | 'PAID';
export type PaymentBucket = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'PAID';

export const DUE_SOON_DAYS = 3;
const MS_PER_DAY = 86_400_000;

function stripTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export interface PaymentLike {
  amountDue: number | { toNumber(): number };
  amountPaid: number | { toNumber(): number };
  dueDate: Date;
}

function toNum(val: number | { toNumber(): number }): number {
  return typeof val === 'number' ? val : val.toNumber();
}

/**
 * Pure status derivation — never stored, so a missed cron run can't leave a
 * payment showing a stale status. `today` is a parameter so this stays testable.
 */
export function getPaymentStatus(
  payment: PaymentLike,
  today: Date = new Date(),
): PaymentStatus {
  const amountDue = toNum(payment.amountDue);
  const amountPaid = toNum(payment.amountPaid);
  if (amountPaid >= amountDue) return 'PAID';

  const due = stripTime(payment.dueDate);
  const now = stripTime(today);
  if (now < due) return 'PENDING';
  if (now === due) return 'DUE';
  return 'OVERDUE';
}

/**
 * Coarser grouping used by the payments board and the dashboard action queue.
 * Defined once here so "jatuh tempo <= 3 hari" means the same thing in both.
 */
export function getPaymentBucket(
  payment: PaymentLike,
  today: Date = new Date(),
): PaymentBucket {
  const status = getPaymentStatus(payment, today);
  if (status === 'PAID') return 'PAID';
  if (status === 'OVERDUE') return 'OVERDUE';

  const daysUntilDue = (stripTime(payment.dueDate) - stripTime(today)) / MS_PER_DAY;
  return daysUntilDue <= DUE_SOON_DAYS ? 'DUE_SOON' : 'UPCOMING';
}

export interface PaymentStatusBreakdownItem {
  count: number;
  amount: number;
  percentage: number;
}

export interface PaymentStatusBreakdown {
  totalCount: number;
  totalAmountDue: number;
  paid: PaymentStatusBreakdownItem;
  dueSoon: PaymentStatusBreakdownItem; // H-7 s/d Hari H
  overdue: PaymentStatusBreakdownItem; // Lewat Hari H
  upcoming: PaymentStatusBreakdownItem; // > H+7
}

/**
 * Classifies an invoice according to Slide 3 business rules:
 * - PAID: amountPaid >= amountDue
 * - OVERDUE: today > dueDate (diffDays < 0)
 * - DUE_SOON: dueDate - 7 <= today <= dueDate (0 <= diffDays <= 7)
 * - UPCOMING: > 7 days ahead
 */
export function classifyPaymentForBreakdown(
  payment: PaymentLike,
  today: Date = new Date(),
): 'PAID' | 'DUE_SOON' | 'OVERDUE' | 'UPCOMING' {
  const amountDue = toNum(payment.amountDue);
  const amountPaid = toNum(payment.amountPaid);
  if (amountPaid >= amountDue) return 'PAID';

  const due = stripTime(payment.dueDate);
  const now = stripTime(today);
  const diffDays = Math.ceil((due - now) / MS_PER_DAY);

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 7) return 'DUE_SOON';
  return 'UPCOMING';
}

/**
 * Pure aggregation: Receivables status breakdown (Slide 3) across invoices.
 */
export function getPaymentStatusBreakdown(
  payments: PaymentLike[],
  today: Date = new Date(),
): PaymentStatusBreakdown {
  const totalCount = payments.length;
  let totalAmountDue = 0;

  const counts = { PAID: 0, DUE_SOON: 0, OVERDUE: 0, UPCOMING: 0 };
  const amounts = { PAID: 0, DUE_SOON: 0, OVERDUE: 0, UPCOMING: 0 };

  for (const p of payments) {
    const due = toNum(p.amountDue);
    const paid = toNum(p.amountPaid);
    const outstanding = Math.max(0, due - paid);
    totalAmountDue += due;

    const cat = classifyPaymentForBreakdown(p, today);
    counts[cat] += 1;
    amounts[cat] += cat === 'PAID' ? paid : outstanding;
  }

  const toItem = (cat: 'PAID' | 'DUE_SOON' | 'OVERDUE' | 'UPCOMING'): PaymentStatusBreakdownItem => ({
    count: counts[cat],
    amount: amounts[cat],
    percentage: totalCount > 0 ? Math.round((counts[cat] / totalCount) * 1000) / 10 : 0,
  });

  return {
    totalCount,
    totalAmountDue,
    paid: toItem('PAID'),
    dueSoon: toItem('DUE_SOON'),
    overdue: toItem('OVERDUE'),
    upcoming: toItem('UPCOMING'),
  };
}
