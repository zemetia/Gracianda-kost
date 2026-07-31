import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricBlock, MetricInline, MetricRow } from '@/components/ui/Metric';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { electricityModeLabel, isMetered } from '@/lib/electricity';
import { formatDate, formatNumber, formatRupiah } from '@/lib/utils';
import { attachmentService } from '@/services/attachment.service';
import { paymentMethodService } from '@/services/payment-method.service';
import { getPaymentStatus, paymentService } from '@/services/payment.service';
import { settingService } from '@/services/setting.service';

import { MarkPaidButton } from '../MarkPaidButton';
import { PaymentStatusBadge } from '../PaymentStatusBadge';
import { SendWaButton } from '../SendWaButton';
import { AddPaymentForm } from './AddPaymentForm';
import { ElectricityForm } from './ElectricityForm';
import { PaymentProofUpload } from './PaymentProofUpload';

interface Props {
  params: Promise<{ id: string }>;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params;
  const [payment, session, proofs, tariffPerKwh, paymentMethods] = await Promise.all([
    paymentService.getById(id),
    getSession(),
    attachmentService.listFor('PAYMENT', id),
    settingService.getElectricityTariff(),
    paymentMethodService.listActive(),
  ]);
  if (!payment) notFound();

  const paymentMethodOptions = paymentMethods.map((method) => ({ value: method.id, label: method.name }));

  const canManage = session && ['SUPER_ADMIN', 'KEUANGAN'].includes(session.user.role);
  const status = getPaymentStatus(payment);
  const amountDue = payment.amountDue.toNumber();
  const amountPaid = payment.amountPaid.toNumber();

  const electricityMode = payment.contract.room.electricityMode;
  const electricityKwh = payment.electricityKwh?.toNumber() ?? null;
  const electricityAmount = payment.electricityAmount?.toNumber() ?? 0;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            {MONTH_NAMES_ID[payment.periodMonth - 1]} {payment.periodYear}
          </Typography>
          <Typography variant="muted">
            <Link href={`/admin/contracts/${payment.contractId}`} className="hover:underline">
              {payment.contract.contractCode}
            </Link>{' '}
            · {payment.contract.tenant.fullName} · {payment.contract.room.property.name} · Unit {payment.contract.room.number} {payment.contract.room.floor ? `(${payment.contract.room.floor.name})` : ''}
          </Typography>
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      <MetricRow columns={3}>
        <MetricBlock label="Tagihan" value={formatNumber(amountDue)} prefix="Rp" size="secondary" />
        <MetricBlock label="Sudah Dibayar" value={formatNumber(amountPaid)} prefix="Rp" size="secondary" />
        <MetricBlock
          label="Sisa"
          value={formatNumber(Math.max(amountDue - amountPaid, 0))}
          prefix="Rp"
          size="secondary"
          tone={amountPaid < amountDue ? 'destructive' : 'muted'}
        />
      </MetricRow>

      <div className="max-w-xl">
        {electricityAmount > 0 && (
          <>
            <MetricInline label="Sewa" value={formatRupiah(payment.rentAmount.toNumber())} />
            <MetricInline
              label={`Listrik (${formatNumber(electricityKwh ?? 0)} kWh × ${formatRupiah(
                payment.electricityRate?.toNumber() ?? tariffPerKwh,
              )})`}
              value={formatRupiah(electricityAmount)}
            />
          </>
        )}
        <MetricInline label="Jatuh tempo" value={formatDate(payment.dueDate, 'id-ID')} />
        <MetricInline
          label="Lunas pada"
          value={payment.paidAt ? formatDate(payment.paidAt, 'id-ID') : '—'}
        />
        {payment.paymentMethod && <MetricInline label="Metode" value={payment.paymentMethod.name} />}
        {payment.note && <MetricInline label="Catatan" value={payment.note} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listrik</CardTitle>
        </CardHeader>
        <CardContent>
          {isMetered(electricityMode) ? (
            canManage ? (
              <ElectricityForm
                paymentId={payment.id}
                tariffPerKwh={tariffPerKwh}
                currentKwh={electricityKwh}
              />
            ) : (
              <Typography variant="muted">
                {electricityKwh === null
                  ? 'Pemakaian periode ini belum dicatat.'
                  : `${formatNumber(electricityKwh)} kWh — ${formatRupiah(electricityAmount)}.`}
              </Typography>
            )
          ) : (
            <Typography variant="muted">
              Listrik kamar ini “{electricityModeLabel(electricityMode)}” — tidak ada tagihan listrik
              pada periode ini.
            </Typography>
          )}
        </CardContent>
      </Card>

      {(status === 'DUE' || status === 'OVERDUE') && (
        <Card>
          <CardHeader>
            <CardTitle>Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <SendWaButton
              paymentId={payment.id}
              phone={payment.contract.tenant.phone}
              tenantName={payment.contract.tenant.fullName}
              contractCode={payment.contract.contractCode}
              roomNumber={payment.contract.room.number}
              periodMonth={payment.periodMonth}
              periodYear={payment.periodYear}
              amountDue={amountDue}
              amountPaid={amountPaid}
              dueDate={payment.dueDate}
            />
          </CardContent>
        </Card>
      )}

      {canManage && status !== 'PAID' && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MarkPaidButton paymentId={payment.id} paymentMethods={paymentMethodOptions} />
            <AddPaymentForm paymentId={payment.id} paymentMethods={paymentMethodOptions} />
          </CardContent>
        </Card>
      )}

      {(proofs.length > 0 || canManage) && (
        <Card>
          <CardHeader>
            <CardTitle>Bukti Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <PaymentProofUpload paymentId={payment.id} attachments={proofs} />
            ) : (
              <div className="flex flex-wrap gap-3">
                {proofs.map((proof) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={proof.id}
                    src={proof.url}
                    alt="Bukti transfer"
                    className="h-32 w-48 rounded-md border border-border object-cover"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
