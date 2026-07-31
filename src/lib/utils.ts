export function formatDate(
  date: Date | string | number,
  locale = 'en',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' },
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

const idNumber = new Intl.NumberFormat('id-ID');

/** Business figures are always id-ID, no decimals: `Rp 12.400.000`. */
export function formatRupiah(value: number): string {
  return `Rp ${idNumber.format(Math.round(value))}`;
}

/** Compact form for hero metrics and chart labels only — never tables or exports. */
export function formatRupiahShort(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `Rp ${formatDecimal(value / 1_000_000_000)} M`;
  if (abs >= 1_000_000) return `Rp ${formatDecimal(value / 1_000_000)} jt`;
  if (abs >= 1_000) return `Rp ${formatDecimal(value / 1_000)} rb`;
  return formatRupiah(value);
}

/** Counts — plain integer with id-ID grouping. */
export function formatNumber(value: number): string {
  return idNumber.format(value);
}

/** One decimal, comma separator, `%` attached: `86,4%`. */
export function formatPercent(value: number): string {
  return `${formatDecimal(value)}%`;
}

function formatDecimal(value: number): string {
  return value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function truncate(str: string, maxLength: number, suffix = '…'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length).trimEnd() + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isServer(): boolean {
  return typeof window === 'undefined';
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
