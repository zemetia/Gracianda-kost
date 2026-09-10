'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { Landmark, Banknote, ShieldCheck } from 'lucide-react';

interface ReconciliationData {
  bankTransfer: {
    total: number;
    count: number;
    percentAmount: number;
    percentCount: number;
  };
  cash: {
    total: number;
    count: number;
    percentAmount: number;
    percentCount: number;
  };
}

interface Props {
  reconciliation: ReconciliationData;
  totalReceived: number;
  totalCount: number;
}

export function CashReconciliationCard({ reconciliation, totalReceived, totalCount }: Props) {
  const [metricMode, setMetricMode] = useState<'amount' | 'count'>('amount');

  const { bankTransfer, cash } = reconciliation;
  const transferPercent = metricMode === 'amount' ? bankTransfer.percentAmount : bankTransfer.percentCount;
  const cashPercent = metricMode === 'amount' ? cash.percentAmount : cash.percentCount;

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">
            Rekonsiliasi Kas: Transfer vs Tunai
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            Total kas diterima: {formatRupiah(totalReceived)} — kontrol kas fisik pengelola vs rekening bank
          </CardDescription>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMetricMode('amount')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              metricMode === 'amount'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Nominal Rupiah
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('count')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              metricMode === 'count'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Frekuensi Transaksi
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {totalCount === 0 ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            Belum ada pembayaran terverifikasi untuk periode ini.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Two-Tone Stacked Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-info">
                  <Landmark className="h-3.5 w-3.5" /> Transfer Bank ({formatPercent(transferPercent)})
                </span>
                <span className="flex items-center gap-1.5 text-success">
                  <Banknote className="h-3.5 w-3.5" /> Tunai / Cash ({formatPercent(cashPercent)})
                </span>
              </div>
              <div className="flex h-5 w-full overflow-hidden rounded-full bg-surface-raised">
                <div
                  style={{ width: `${transferPercent}%` }}
                  className="bg-info transition-all duration-300"
                  title={`Transfer Bank: ${formatPercent(transferPercent)}`}
                />
                <div
                  style={{ width: `${cashPercent}%` }}
                  className="bg-success transition-all duration-300"
                  title={`Cash: ${formatPercent(cashPercent)}`}
                />
              </div>
            </div>

            {/* Split Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                    <Landmark className="h-4 w-4 text-info" />
                    Transfer Bank & Digital
                  </span>
                  <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-bold text-info">
                    {formatPercent(bankTransfer.percentAmount)}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {formatRupiah(bankTransfer.total)}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {formatNumber(bankTransfer.count)} transaksi via rekening bank & e-wallet
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                    <Banknote className="h-4 w-4 text-success" />
                    Cash on Hand Pengelola
                  </span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                    {formatPercent(cash.percentAmount)}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {formatRupiah(cash.total)}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {formatNumber(cash.count)} transaksi tunai diterima langsung
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-2 text-[11px] text-foreground-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                  <span>Siap direkonsiliasi fisik & disetor ke rekening pemilik</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
