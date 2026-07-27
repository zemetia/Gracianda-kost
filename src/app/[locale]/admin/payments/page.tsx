import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPaymentStatus, paymentService, type PaymentStatus } from '@/services/payment.service';

import { GenerateInvoicesForm } from './GenerateInvoicesForm';
import { PaymentStatusBadge } from './PaymentStatusBadge';

interface Props {
  searchParams: Promise<{ status?: string; month?: string; year?: string }>;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default async function PaymentsPage({ searchParams }: Props) {
  const { status, month, year } = await searchParams;
  const [payments, session] = await Promise.all([paymentService.list(), getSession()]);
  const canManage = session && ['SUPER_ADMIN', 'KEUANGAN'].includes(session.user.role);

  const rows = payments
    .map((payment) => ({ payment, status: getPaymentStatus(payment) }))
    .filter(({ payment, status: derivedStatus }) => {
      if (status && derivedStatus !== (status as PaymentStatus)) return false;
      if (month && payment.periodMonth !== Number(month)) return false;
      if (year && payment.periodYear !== Number(year)) return false;
      return true;
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Pembayaran
          </Typography>
          <Typography variant="muted">Tagihan sewa bulanan seluruh kontrak aktif.</Typography>
        </div>
        {canManage && <GenerateInvoicesForm />}
      </div>

      <Card>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-status" className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                id="filter-status"
                name="status"
                defaultValue={status ?? ''}
                className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Semua</option>
                <option value="PENDING">Belum Jatuh Tempo</option>
                <option value="DUE">Jatuh Tempo</option>
                <option value="OVERDUE">Terlambat</option>
                <option value="PAID">Lunas</option>
              </select>
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
              Filter
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Kontrak</th>
              <th className="px-4 py-3 font-medium">Penyewa</th>
              <th className="px-4 py-3 font-medium">Kamar</th>
              <th className="px-4 py-3 font-medium">Periode</th>
              <th className="px-4 py-3 font-medium">Tagihan</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ payment, status: derivedStatus }) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link href={`/admin/payments/${payment.id}`} className="hover:underline">
                    {payment.contract.contractCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{payment.contract.tenant.fullName}</td>
                <td className="px-4 py-3 text-foreground-muted">
                  {payment.contract.room.property.name} — No. {payment.contract.room.number} {payment.contract.room.floor ? `(${payment.contract.room.floor.name})` : ''}
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {MONTH_NAMES_ID[payment.periodMonth - 1]} {payment.periodYear}
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  Rp {payment.amountDue.toNumber().toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={derivedStatus} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground-subtle">
                  Tidak ada tagihan ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
