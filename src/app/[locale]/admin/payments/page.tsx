import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate, formatNumber, formatRupiah } from '@/lib/utils';
import { paymentMethodService } from '@/services/payment-method.service';
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

export default async function PaymentsPage({ searchParams }: Props) {
  const { bucket, month, year, q, propertyId } = await searchParams;
  const activeBucket: BucketFilter = isBucket(bucket) ? bucket : 'ALL';

  const scopedPropertyId = await getPropertyScope(propertyId);
  const [payments, session, paymentMethods] = await Promise.all([
    paymentService.list({
      propertyId: scopedPropertyId,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      q: q || undefined,
    }),
    getSession(),
    paymentMethodService.listActive(),
  ]);
  const canManage = session && ['SUPER_ADMIN', 'KEUANGAN'].includes(session.user.role);
  const paymentMethodOptions = paymentMethods.map((method) => ({ value: method.id, label: method.name }));

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

      {/* Bucket tabs: how many, and how much money is still out there.
          Hairline-separated columns — the active one is marked by type, not a box. */}
      <div className="grid grid-cols-2 gap-6 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-border lg:[&>*:not(:first-child)]:pl-6">
        {summary.map((tab) => (
          <Link
            key={tab.value}
            href={queryFor(tab.value)}
            aria-current={activeBucket === tab.value ? 'page' : undefined}
            className="group block rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`block text-xs font-medium uppercase tracking-wide ${
                activeBucket === tab.value ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground'
              }`}
            >
              {tab.label}
            </span>
            <span
              className={`mt-2 block text-2xl font-medium tracking-tight tabular-nums underline decoration-transparent underline-offset-4 transition group-hover:decoration-border-strong ${
                activeBucket === tab.value ? 'text-foreground' : 'text-foreground-muted'
              }`}
            >
              {formatNumber(tab.count)}
            </span>
            <span className="mt-1 block text-xs text-foreground-muted">
              {tab.value !== 'PAID' && tab.amount > 0 ? formatRupiah(tab.amount) : ' '}
            </span>
          </Link>
        ))}
      </div>

      <Card noPadding>
        <CardContent className="p-4">
          <form method="get" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {activeBucket !== 'ALL' && <input type="hidden" name="bucket" value={activeBucket} />}
            <div className="grid flex-1 grid-cols-2 gap-4 lg:max-w-2xl lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <Input
                id="filter-q"
                name="q"
                label="Cari"
                size="sm"
                defaultValue={q ?? ''}
                placeholder="Nama penyewa, no. kamar, kode kontrak"
              />
              <Select
                name="month"
                label="Bulan"
                size="sm"
                placeholder="Semua"
                allowEmpty
                defaultValue={month ?? ''}
                options={MONTH_NAMES_ID.map((name, i) => ({ value: String(i + 1), label: name }))}
              />
              <Input
                id="filter-year"
                name="year"
                label="Tahun"
                type="number"
                size="sm"
                defaultValue={year ?? ''}
                placeholder={String(new Date().getFullYear())}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="shrink-0">
              Terapkan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Penyewa</TableHead>
            <TableHead>Kamar</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead className="text-right">Sisa Tagihan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ditagih</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map(({ payment, status, outstanding }) => {
            const lastReminder = payment.reminders[0];
            return (
              <TableRow key={payment.id}>
                <TableCell>
                  <Link href={`/admin/payments/${payment.id}`} className="font-medium text-foreground hover:underline">
                    {payment.contract.tenant.fullName}
                  </Link>
                  <span className="block text-xs text-foreground-muted">
                    {payment.contract.contractCode}
                  </span>
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {payment.contract.room.property.name} — No. {payment.contract.room.number}
                  {payment.contract.room.floor ? ` (${payment.contract.room.floor.name})` : ''}
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {MONTH_NAMES_ID[payment.periodMonth - 1]} {payment.periodYear}
                  <span className="block text-xs tabular-nums text-foreground-muted">
                    Jatuh tempo {formatDate(payment.dueDate, 'id-ID')}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-foreground">
                  {outstanding > 0 ? formatRupiah(outstanding) : '—'}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={status} />
                </TableCell>
                <TableCell className="text-xs tabular-nums text-foreground-muted">
                  {lastReminder ? formatDate(lastReminder.sentAt, 'id-ID') : '—'}
                </TableCell>
                <TableCell>
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
                      <MarkPaidButton
                        paymentId={payment.id}
                        paymentMethods={paymentMethodOptions}
                        size="xs"
                        label="Lunas"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {visibleRows.length === 0 && (
            <TableEmpty colSpan={7}>Tidak ada tagihan pada filter ini.</TableEmpty>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
