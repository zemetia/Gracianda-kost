import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { attachmentService } from '@/services/attachment.service';
import { getPaymentStatus, paymentService } from '@/services/payment.service';

import { PaymentStatusBadge } from '../PaymentStatusBadge';
import { AddPaymentForm } from './AddPaymentForm';
import { MarkPaidButton } from './MarkPaidButton';
import { PaymentProofUpload } from './PaymentProofUpload';
import { SendWaButton } from './SendWaButton';

interface Props {
  params: Promise<{ id: string }>;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params;
  const [payment, session, proofs] = await Promise.all([
    paymentService.getById(id),
    getSession(),
    attachmentService.listFor('PAYMENT', id),
  ]);
  if (!payment) notFound();

  const canManage = session && ['SUPER_ADMIN', 'KEUANGAN'].includes(session.user.role);
  const status = getPaymentStatus(payment);
  const amountDue = payment.amountDue.toNumber();
  const amountPaid = payment.amountPaid.toNumber();

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
            · {payment.contract.tenant.fullName} · Kamar {payment.contract.room.number} (
            {payment.contract.room.floor.name})
          </Typography>
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Tagihan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Typography variant="muted">Tagihan</Typography>
            <Typography variant="p">Rp {amountDue.toLocaleString('id-ID')}</Typography>
          </div>
          <div>
            <Typography variant="muted">Sudah Dibayar</Typography>
            <Typography variant="p">Rp {amountPaid.toLocaleString('id-ID')}</Typography>
          </div>
          <div>
            <Typography variant="muted">Jatuh Tempo</Typography>
            <Typography variant="p">{payment.dueDate.toLocaleDateString('id-ID')}</Typography>
          </div>
          <div>
            <Typography variant="muted">Lunas Pada</Typography>
            <Typography variant="p">
              {payment.paidAt ? payment.paidAt.toLocaleDateString('id-ID') : '—'}
            </Typography>
          </div>
          {payment.method && (
            <div>
              <Typography variant="muted">Metode</Typography>
              <Typography variant="p">{payment.method}</Typography>
            </div>
          )}
          {payment.note && (
            <div className="col-span-2">
              <Typography variant="muted">Catatan</Typography>
              <Typography variant="p">{payment.note}</Typography>
            </div>
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
            <MarkPaidButton paymentId={payment.id} />
            <AddPaymentForm paymentId={payment.id} />
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
