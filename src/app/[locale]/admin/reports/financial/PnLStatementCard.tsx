'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatPercent, formatRupiah } from '@/lib/utils';
import { TrendingUp, TrendingDown, Layers, FileText } from 'lucide-react';

interface Props {
  totalRevenue: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
  profit: number;
  margin: number | null;
  expenseByCategory: Array<{ category: string; label: string; total: number }>;
}

export function PnLStatementCard({
  totalRevenue,
  maintenanceCost,
  expenseCost,
  totalCost,
  profit,
  margin,
  expenseByCategory,
}: Props) {
  const isProfitable = profit >= 0;

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Laporan Laba Rugi (P&amp;L Statement)
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Pemisahan tegas biaya perawatan kamar vs beban operasional gedung untuk perhitungan laba bersih riil
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isProfitable
                  ? 'bg-success/15 text-success'
                  : 'bg-destructive/15 text-destructive'
              }`}
            >
              {isProfitable ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {margin !== null ? `Net Margin: ${formatPercent(margin)}` : 'Margin: —'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          {/* Statement Sheet */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border/60">
            {/* 1. REVENUE SECTION */}
            <div className="p-4 bg-surface-raised/30">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-foreground">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  1. PENDAPATAN KOTOR (GROSS REVENUE)
                </span>
                <span className="tabular-nums text-foreground">{formatRupiah(totalRevenue)}</span>
              </div>
              <div className="mt-3 pl-6 text-xs divide-y divide-border/30">
                <div className="flex items-center justify-between py-1.5 text-foreground-muted">
                  <span>Penerimaan Sewa Kamar &amp; Fasilitas Ekstra</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {formatRupiah(totalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. COST SECTION */}
            <div className="p-4">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-foreground">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-warning" />
                  2. TOTAL BIAYA &amp; PENGELUARAN (TOTAL COST)
                </span>
                <span className="tabular-nums text-foreground">{formatRupiah(totalCost)}</span>
              </div>

              <div className="mt-3 pl-6 text-xs flex flex-col gap-2">
                {/* 2a. Room Maintenance */}
                <div className="rounded-lg border border-border/60 bg-surface/40 p-3">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>A. Biaya Perawatan &amp; Perbaikan Kamar</span>
                    <span className="tabular-nums text-foreground">
                      {formatRupiah(maintenanceCost)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-foreground-muted">
                    Suku cadang, AC, sanitasi, tukang, dan perbaikan unit kamar
                  </p>
                </div>

                {/* 2b. Building Operating Expenses */}
                <div className="rounded-lg border border-border/60 bg-surface/40 p-3">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>B. Biaya Operasional Gedung / Properti</span>
                    <span className="tabular-nums text-foreground">{formatRupiah(expenseCost)}</span>
                  </div>
                  <div className="mt-2 pl-2 border-l border-border/60 space-y-1 text-foreground-muted text-[11px]">
                    {expenseByCategory.map((exp) => (
                      <div key={exp.category} className="flex items-center justify-between">
                        <span>{exp.label}</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatRupiah(exp.total)}
                        </span>
                      </div>
                    ))}
                    {expenseByCategory.length === 0 && (
                      <p className="text-foreground-muted">Belum ada pos beban tercatat.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. NET PROFIT SECTION */}
            <div
              className={`p-4 flex items-center justify-between ${
                isProfitable
                  ? 'bg-success/10 border-t-2 border-success'
                  : 'bg-destructive/10 border-t-2 border-destructive'
              }`}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                  3. LABA BERSIH (NET PROFIT)
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Gross Revenue − (Biaya Kamar + Biaya Operasional Gedung)
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-black tracking-tight tabular-nums ${
                    isProfitable ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {formatRupiah(profit)}
                </p>
                <p className="text-xs font-semibold text-foreground-muted">
                  {margin !== null ? `Net Margin: ${formatPercent(margin)}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
