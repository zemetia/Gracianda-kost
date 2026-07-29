/**
 * Pure billing-period rules. Lives in `lib` (not the service) so both the
 * Prisma-backed service and the unit tests use the same implementation —
 * a copy in the test file is a copy that silently drifts.
 *
 * A billing period, not a calendar month, is the unit of invoicing: a DAILY
 * contract has ~30 periods inside one month, a 3-monthly contract has one
 * period every third month. Everything below derives from `startDate`, so a
 * tenant who moved in on the 17th is billed on the 17th — not on a global
 * "tanggal 5" that belongs to nobody.
 */

export type BillingCycleName = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface BillableContract {
  billingCycle: string;
  billingInterval: number;
  startDate: Date;
  endDate?: Date | null;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
}

/** Month arithmetic that clamps instead of overflowing: 31 Jan + 1 month = 28/29 Feb. */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const dayOfMonth = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(dayOfMonth, lastDay));
  return result;
}

/** `date` advanced by `times` whole billing cycles. */
export function addCycles(
  date: Date,
  cycle: string,
  interval: number,
  times = 1,
): Date {
  const steps = interval * times;
  const result = new Date(date);

  switch (cycle) {
    case 'DAILY':
      result.setDate(result.getDate() + steps);
      return result;
    case 'WEEKLY':
      result.setDate(result.getDate() + steps * 7);
      return result;
    case 'YEARLY':
      return addMonths(date, steps * 12);
    default:
      return addMonths(date, steps);
  }
}

/** The very first billing period of a contract — the invoice raised at signing. */
export function firstPeriod(contract: BillableContract): BillingPeriod {
  return {
    start: contract.startDate,
    end: addCycles(contract.startDate, contract.billingCycle, contract.billingInterval),
  };
}

// Contracts are finite in practice; the cap only stops a malformed row (e.g.
// interval 0) from spinning forever.
const MAX_PERIODS = 2000;

/**
 * Every billing period of a contract that *starts* within `[rangeStart, rangeEnd)`.
 * Periods after `contract.endDate` are excluded — a contract that ends mid-month
 * stops being billed mid-month.
 */
export function periodsInRange(
  contract: BillableContract,
  rangeStart: Date,
  rangeEnd: Date,
): BillingPeriod[] {
  const periods: BillingPeriod[] = [];
  const hardEnd = contract.endDate ?? null;

  let start = contract.startDate;
  for (let index = 0; index < MAX_PERIODS; index += 1) {
    if (start >= rangeEnd) break;
    if (hardEnd && start >= hardEnd) break;

    const end = addCycles(
      contract.startDate,
      contract.billingCycle,
      contract.billingInterval,
      index + 1,
    );
    if (end <= start) break;

    if (start >= rangeStart) periods.push({ start, end });
    start = end;
  }

  return periods;
}

/** Calendar month `[first, firstOfNextMonth)` — the range an invoice run covers. */
export function monthRange(periodMonth: number, periodYear: number): BillingPeriod {
  return {
    start: new Date(periodYear, periodMonth - 1, 1),
    end: new Date(periodYear, periodMonth, 1),
  };
}
