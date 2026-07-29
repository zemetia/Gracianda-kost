import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import {
  getPaymentBucket,
  getPaymentStatus,
  paymentService,
  type PaymentBucket,
} from '@/services/payment.service';

import { GenerateInvoicesForm } from './GenerateInvoicesForm';
import { MarkPaidButton } from './MarkPaidButton';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { SendWaButton } from './SendWaButton';

interface Props {
  searchParams: Promise<{
    bucket?: string;
    month?: string;
    year?: string;
    q?: string;
    propertyId?: string;
  }>;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type BucketFilter = PaymentBucket | 'ALL';

const BUCKETS: { value: BucketFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'OVERDUE', label: 'Terlambat' },
  { value: 'DUE_SOON', label: 'Jatuh Tempo' },
  { value: 'UPCOMING', label: 'Belum Jatuh Tempo' },
  { value: 'PAID', label: 'Lunas' },
];

function isBucket(value: string | undefined): value is BucketFilter {
  return BUCKETS.some((bucket) => bucket.value === value);
}

function rupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { bucket, month, year, q, propertyId } = await searchParams;
  const activeBucket: BucketFilter = isBucket(bucket) ? bucket : 'ALL';

  const scopedPropertyId = await getPropertyScope(propertyId);
  const [payments, session] = await Promise.all([
    paymentService.list({
      propertyId: scopedPropertyId,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      q: q || undefined,
    }),
    getSession(),
  ]);
  const canManage = session && ['SUPER_ADMIN', 'KEUANGAN'].includes(session.user.role);

  const today = new Date();
  const rows = payments.map((payment) => ({
    payment,
    status: getPaymentStatus(payment, today),
    bucket: getPaymentBucket(payment, today),
    outstanding: Math.max(payment.amountDue.toNumber() - payment.amountPaid.toNumber(), 0),
  }));

  // Tab counts are computed over the *filtered* set so they always match what
  // clicking the tab will show.
  const summary = BUCKETS.map((tab) => {
    const matching = tab.value === 'ALL' ? rows : rows.filter((row) => row.bucket === tab.value);
    return {
      ...tab,
      count: matching.length,
      amount: matching.reduce((sum, row) => sum + row.outstanding, 0),
    };
  });

  const visibleRows = activeBucket === 'ALL' ? rows : rows.filter((row) => row.bucket === activeBucket);

  const queryFor = (nextBucket: BucketFilter) => {
    const params = new URLSearchParams();
    if (nextBucket !== 'ALL') params.set('bucket', nextBucket);
    if (month) params.set('month', month);
    if (year) params.set('year', year);
    if (q) params.set('q', q);
    if (propertyId) params.set('propertyId', propertyId);
    const query = params.toString();
    return query ? `/admin/payments?${query}` : '/admin/payments';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Pembayaran
          </Typography>
          <Typography variant="muted">Papan kerja penagihan — aksi ada di barisnya langsung.</Typography>
        </div>
        {canManage && <GenerateInvoicesForm />}
      </div>

      {/* Bucket tabs: how many, and how much money is still out there */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((tab) => (
          <Link
            key={tab.value}
            href={queryFor(tab.value)}
            className={`flex flex-col gap-1 rounded-xl border p-3 transition-colors ${
              activeBucket === tab.value
                ? 'border-primary bg-primary-subtle'
                : 'border-border bg-surface hover:border-border-strong'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {tab.label}
            </span>
            <span className="text-lg font-bold text-foreground">{tab.count}</span>
            {tab.value !== 'PAID' && tab.amount > 0 && (
              <span className="text-xs text-foreground-muted">{rupiah(tab.amount)}</span>
            )}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            {activeBucket !== 'ALL' && <input type="hidden" name="bucket" value={activeBucket} />}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-q" className="text-sm font-medium text-foreground">
                Cari
              </label>
              <input
                id="filter-q"
                name="q"
                defaultValue={q ?? ''}
                placeholder="Nama penyewa, no. kamar, kode kontrak"
                className="h-9 w-64 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-month" className="text-sm font-medium text-foreground">
                Bulan
              </label>
              <select
                id="filter-month"
                name="month"
                defaultValue={month ?? ''}
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Semua</option>
                {MONTH_NAMES_ID.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-year" className="text-sm font-medium text-foreground">
                Tahun
              </label>
              <input
                id="filter-year"
                name="year"
                type="number"
                defaultValue={year ?? ''}
                placeholder={String(new Date().getFullYear())}
                className="h-9 w-28 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="h-9 rounded-md border border-border bg-surface-raised px-4 text-sm font-medium text-foreground hover:border-border-strong"
            >
              Terapkan
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Penyewa</th>
              <th className="px-4 py-3 font-medium">Kamar</th>
              <th className="px-4 py-3 font-medium">Periode</th>
              <th className="px-4 py-3 font-medium">Sisa Tagihan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ditagih</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleRows.map(({ payment, status, outstanding }) => {
              const lastReminder = payment.reminders[0];
              return (
                <tr key={payment.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/payments/${payment.id}`} className="font-medium text-foreground hover:underline">
                      {payment.contract.tenant.fullName}
                    </Link>
                    <span className="block text-xs text-foreground-subtle">
                      {payment.contract.contractCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {payment.contract.room.property.name} — No. {payment.contract.room.number}
                    {payment.contract.room.floor ? ` (${payment.contract.room.floor.name})` : ''}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {MONTH_NAMES_ID[payment.periodMonth - 1]} {payment.periodYear}
                    <span className="block text-xs text-foreground-subtle">
                      Jatuh tempo {payment.dueDate.toLocaleDateString('id-ID')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {outstanding > 0 ? rupiah(outstanding) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-muted">
                    {lastReminder ? lastReminder.sentAt.toLocaleDateString('id-ID') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {status !== 'PAID' && (
                        <SendWaButton
                          size="xs"
                          label="WA"
                          paymentId={payment.id}
                          phone={payment.contract.tenant.phone}
                          tenantName={payment.contract.tenant.fullName}
                          contractCode={payment.contract.contractCode}
                          roomNumber={payment.contract.room.number}
                          periodMonth={payment.periodMonth}
                          periodYear={payment.periodYear}
                          amountDue={payment.amountDue.toNumber()}
                          amountPaid={payment.amountPaid.toNumber()}
                          dueDate={payment.dueDate}
                        />
                      )}
                      {canManage && status !== 'PAID' && (
                        <MarkPaidButton paymentId={payment.id} size="xs" label="Lunas" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-foreground-subtle">
                  Tidak ada tagihan pada filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
