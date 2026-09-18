'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatDate, formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { classifyPaymentForBreakdown } from '@/lib/payment-status';
import { SendWaButton } from './SendWaButton';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export interface PaymentStatusBarItem {
  id: string;
  dueDate: Date;
  periodMonth: number;
  periodYear: number;
  amountDue: number;
  amountPaid: number;
  contract: {
    contractCode: string;
    tenant: { fullName: string; phone: string };
    room: { number: string };
  };
}

interface Props {
  payments: PaymentStatusBarItem[];
}

export function PaymentStatusBar({ payments }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Classify each invoice according to Slide 3 business rules
  const classified = payments.map((payment) => {
    const due = new Date(payment.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const outstanding = Math.max(payment.amountDue - payment.amountPaid, 0);
    const statusCategory = classifyPaymentForBreakdown(payment, today);

    return {
      payment,
      statusCategory,
      outstanding,
      diffDays,
    };
  });

  const totalBilled = payments.length;
  const paidList = classified.filter((c) => c.statusCategory === 'PAID');
  const dueSoonList = classified.filter((c) => c.statusCategory === 'DUE_SOON');
  const overdueList = classified.filter((c) => c.statusCategory === 'OVERDUE');
  const upcomingList = classified.filter((c) => c.statusCategory === 'UPCOMING');

  const paidPct = totalBilled > 0 ? (paidList.length / totalBilled) * 100 : 0;
  const dueSoonPct = totalBilled > 0 ? (dueSoonList.length / totalBilled) * 100 : 0;
  const overduePct = totalBilled > 0 ? (overdueList.length / totalBilled) * 100 : 0;
  const upcomingPct = totalBilled > 0 ? (upcomingList.length / totalBilled) * 100 : 0;

  const actionableRooms = [...overdueList, ...dueSoonList];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Status Piutang &amp; Kinerja Penagihan
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Distribusi kepatuhan sewa bulan ini ({formatNumber(totalBilled)} kamar ditagih)
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-success">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              Lunas: {formatPercent(paidPct)} ({paidList.length})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-warning">
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              Jatuh Tempo: {formatPercent(dueSoonPct)} ({dueSoonList.length})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-destructive">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              Telat: {formatPercent(overduePct)} ({overdueList.length})
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {totalBilled === 0 ? (
          <p className="py-4 text-center text-sm text-foreground-muted">
            Belum ada tagihan sewa pada periode ini.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Horizontal Stacked Progress Bar */}
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-surface-raised">
              {paidPct > 0 && (
                <div
                  style={{ width: `${paidPct}%` }}
                  className="bg-success transition-all duration-300"
                  title={`Lunas: ${formatPercent(paidPct)} (${paidList.length} kamar)`}
                />
              )}
              {dueSoonPct > 0 && (
                <div
                  style={{ width: `${dueSoonPct}%` }}
                  className="bg-warning transition-all duration-300"
                  title={`Jatuh Tempo (H-7 s/d Hari H): ${formatPercent(dueSoonPct)} (${dueSoonList.length} kamar)`}
                />
              )}
              {overduePct > 0 && (
                <div
                  style={{ width: `${overduePct}%` }}
                  className="bg-destructive transition-all duration-300"
                  title={`Telat / Overdue: ${formatPercent(overduePct)} (${overdueList.length} kamar)`}
                />
              )}
              {upcomingPct > 0 && (
                <div
                  style={{ width: `${upcomingPct}%` }}
                  className="bg-surface-raised border-l border-border transition-all duration-300"
                  title={`Belum Jatuh Tempo (> H+7): ${formatPercent(upcomingPct)} (${upcomingList.length} kamar)`}
                />
              )}
            </div>

            {/* List Kamar Perlu Follow-up */}
            {actionableRooms.length > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface/40 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Kamar Perlu Tindakan ({actionableRooms.length})
                  </h4>
                  <span className="text-xs text-foreground-muted">
                    Total tertunggak/jatuh tempo:{' '}
                    <strong className="text-foreground">
                      {formatRupiah(actionableRooms.reduce((s, r) => s + r.outstanding, 0))}
                    </strong>
                  </span>
                </div>

                <div className="divide-y divide-border/40">
                  {actionableRooms.slice(0, 5).map(({ payment, statusCategory, outstanding, diffDays }) => (
                    <div
                      key={payment.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            statusCategory === 'OVERDUE'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {statusCategory === 'OVERDUE' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Kamar {payment.contract.room.number} · {payment.contract.tenant.fullName}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {statusCategory === 'OVERDUE'
                              ? `Telat ${Math.abs(diffDays)} hari (jatuh tempo ${formatDate(payment.dueDate)})`
                              : diffDays === 0
                              ? 'Jatuh tempo hari ini'
                              : `${diffDays} hari lagi jatuh tempo (${formatDate(payment.dueDate)})`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {formatRupiah(outstanding)}
                        </span>
                        <SendWaButton
                          size="sm"
                          label="Kirim Reminder WA"
                          paymentId={payment.id}
                          phone={payment.contract.tenant.phone}
                          tenantName={payment.contract.tenant.fullName}
                          contractCode={payment.contract.contractCode}
                          roomNumber={payment.contract.room.number}
                          periodMonth={payment.periodMonth}
                          periodYear={payment.periodYear}
                          amountDue={payment.amountDue}
                          amountPaid={payment.amountPaid}
                          dueDate={payment.dueDate}
                        />
                      </div>
                    </div>
                  ))}
                  {actionableRooms.length > 5 && (
                    <p className="pt-2 text-center text-xs text-foreground-muted">
                      Dan {actionableRooms.length - 5} kamar lainnya di tabel bawah.
                    </p>
                  )}
                </div>
              </div>
            )}

            {actionableRooms.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success-subtle p-3 text-xs text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Seluruh tagihan sewa bulan ini telah lunas atau belum mendekati jatuh tempo.</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
