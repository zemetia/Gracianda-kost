import { TrendingUp, TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatPercent, formatRupiah } from '@/lib/utils';
import type { QuarterlyFinancialSummary } from '@/services/dashboard.service';

interface Props {
  summary: QuarterlyFinancialSummary;
}

export function QuarterlyFinancialCard({ summary }: Props) {
  // Find max value in Mio for bar chart scaling
  const maxMio = Math.max(
    1,
    ...summary.quarters.map((q) => Math.max(q.revenueMio, q.costMio)),
  );

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-lg font-bold text-foreground">
                Ringkasan Finansial per Kuartal ({summary.year})
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs">
              Akumulasi pemasukan (Revenue) vs pengeluaran operasional (Cost) dalam satuan jutaan rupiah (in Mio IDR).
            </CardDescription>
          </div>

          {/* Annual Net Margin Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface-raised/40 px-3 py-1.5">
            <span className="text-xs text-foreground-muted">Net Margin Tahunan:</span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold ${
                (summary.totalMarginYearPercent ?? 0) >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {(summary.totalMarginYearPercent ?? 0) >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {summary.totalMarginYearPercent !== null
                ? formatPercent(summary.totalMarginYearPercent)
                : '—'}
            </span>
          </div>
        </div>

        {/* Dual Annual Summary KPI Pills */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-surface p-3">
            <span className="text-[11px] font-medium text-foreground-muted">Total Revenue ({summary.year})</span>
            <p className="mt-0.5 text-base font-bold text-success">
              {summary.totalRevenueYearMio.toFixed(1)} Mio
            </p>
            <span className="text-[10px] text-foreground-subtle">{formatRupiah(summary.totalRevenueYear)}</span>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface p-3">
            <span className="text-[11px] font-medium text-foreground-muted">Total Cost ({summary.year})</span>
            <p className="mt-0.5 text-base font-bold text-warning">
              {summary.totalCostYearMio.toFixed(1)} Mio
            </p>
            <span className="text-[10px] text-foreground-subtle">{formatRupiah(summary.totalCostYear)}</span>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface p-3">
            <span className="text-[11px] font-medium text-foreground-muted">Net Profit ({summary.year})</span>
            <p
              className={`mt-0.5 text-base font-bold ${
                summary.totalProfitYear >= 0 ? 'text-foreground' : 'text-destructive'
              }`}
            >
              {summary.totalProfitYearMio.toFixed(1)} Mio
            </p>
            <span className="text-[10px] text-foreground-subtle">{formatRupiah(summary.totalProfitYear)}</span>
          </div>
          <div className="rounded-lg border border-border/60 bg-surface p-3">
            <span className="text-[11px] font-medium text-foreground-muted">Kuartal Aktif</span>
            <p className="mt-0.5 text-base font-bold text-primary">Q{summary.currentQuarter}</p>
            <span className="text-[10px] text-foreground-subtle">Berjalan otomatis</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Chart Legend */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-success" aria-hidden="true" />
              <span>Revenue (in Mio)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-warning" aria-hidden="true" />
              <span>Cost (in Mio)</span>
            </span>
          </div>
          <span className="text-[11px] text-foreground-subtle">
            Skala: 1 Mio = Rp 1.000.000 (Desimal 1 angka)
          </span>
        </div>

        {/* Dual Bar Chart Q1 - Q4 */}
        <div className="grid grid-cols-4 gap-2 sm:gap-6 border-b border-border/60 pb-6">
          {summary.quarters.map((q) => {
            const revHeightPct = Math.min(100, Math.round((q.revenueMio / maxMio) * 100));
            const costHeightPct = Math.min(100, Math.round((q.costMio / maxMio) * 100));

            return (
              <div
                key={q.quarter}
                className={`flex flex-col items-center rounded-xl p-3 transition-colors ${
                  q.isCurrentQuarter ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-surface-raised/20'
                }`}
              >
                {/* Current Quarter Badge */}
                <div className="h-5 mb-2">
                  {q.isCurrentQuarter && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Aktif
                    </span>
                  )}
                </div>

                {/* Bars Container */}
                <div className="flex h-36 w-full items-end justify-center gap-2 sm:gap-4 px-1">
                  {/* Revenue Bar */}
                  <div className="flex flex-col items-center flex-1 max-w-[32px] h-full justify-end">
                    <span className="mb-1 text-[10px] font-bold text-success truncate">
                      {q.revenueMio.toFixed(1)}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-success transition-all duration-500 min-h-[4px]"
                      style={{ height: `${Math.max(4, revHeightPct)}%` }}
                      title={`Revenue: ${formatRupiah(q.revenue)} (${q.revenueMio.toFixed(1)} Mio)`}
                    />
                  </div>

                  {/* Cost Bar */}
                  <div className="flex flex-col items-center flex-1 max-w-[32px] h-full justify-end">
                    <span className="mb-1 text-[10px] font-bold text-warning truncate">
                      {q.costMio.toFixed(1)}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-warning transition-all duration-500 min-h-[4px]"
                      style={{ height: `${Math.max(4, costHeightPct)}%` }}
                      title={`Cost: ${formatRupiah(q.cost)} (${q.costMio.toFixed(1)} Mio)`}
                    />
                  </div>
                </div>

                {/* Quarter Label */}
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-foreground">{q.label.split(' ')[0]}</p>
                  <p className="text-[10px] text-foreground-muted">{q.label.split(' ')[1] || ''}</p>
                </div>

                {/* Net Margin Pill */}
                <div className="mt-2 text-center">
                  <span
                    className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      (q.netMarginPercent ?? 0) >= 0
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/15 text-destructive'
                    }`}
                  >
                    {q.netMarginPercent !== null ? formatPercent(q.netMarginPercent) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Breakdown Cards per Quarter */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.quarters.map((q) => (
            <div
              key={q.quarter}
              className={`flex flex-col justify-between rounded-lg border p-3 text-xs ${
                q.isCurrentQuarter ? 'border-primary/40 bg-surface shadow-xs' : 'border-border/60 bg-surface'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                  <span className="font-bold text-foreground">{q.label}</span>
                  <span className="text-[11px] font-medium text-foreground-muted">
                    Profit: <strong className={q.netProfit >= 0 ? 'text-success' : 'text-destructive'}>{q.netProfitMio.toFixed(1)} Mio</strong>
                  </span>
                </div>

                <div className="space-y-1 text-foreground-muted">
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium text-foreground">{formatRupiah(q.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-medium text-foreground">{formatRupiah(q.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Profit:</span>
                    <span className="font-semibold text-foreground">{formatRupiah(q.netProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Month Contribution if active */}
              {q.isCurrentQuarter && q.currentMonthContribution && (
                <div className="mt-3 rounded-md bg-primary/10 p-2 text-[11px]">
                  <div className="flex items-center gap-1 font-semibold text-primary">
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    <span>Kontribusi Bulan {q.currentMonthContribution.monthName}</span>
                  </div>
                  <p className="mt-0.5 text-foreground-muted">
                    {formatRupiah(q.currentMonthContribution.revenue)} (
                    <strong className="text-foreground">
                      {q.currentMonthContribution.revenueSharePercent !== null
                        ? `${q.currentMonthContribution.revenueSharePercent.toFixed(1)}%`
                        : '0%'}
                    </strong>{' '}
                    dari Q{q.quarter})
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
