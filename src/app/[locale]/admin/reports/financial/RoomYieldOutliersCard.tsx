import { Trophy, TrendingDown, Wrench, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { formatRupiah } from '@/lib/utils';
import type { RoomYieldOutliersResult } from '@/services/dashboard.service';

interface Props {
  outliers: RoomYieldOutliersResult;
}

export function RoomYieldOutliersCard({ outliers }: Props) {
  const { topRevenue, lowestRevenue, highestMaintenance, lowestMaintenance, periodLabel } =
    outliers;

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-lg font-bold text-foreground">
                Analisis Yield &amp; Cost Ekstrem (Top &amp; Bottom Outliers)
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs">
              Perbandingan ekstrem performa individual kamar dalam periode {periodLabel} untuk evaluasi renovasi dan penetapan harga sewa.
            </CardDescription>
          </div>
          <span className="inline-flex items-center rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-foreground-muted border border-border/60">
            Skala: Mio IDR (1 desimal)
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Top Revenue Room */}
          <div className="flex flex-col justify-between rounded-xl border border-success/30 bg-success-subtle/20 p-4 transition-shadow hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                  <Trophy className="h-3 w-3" aria-hidden="true" />
                  Top Revenue
                </span>
                <span className="text-xs font-semibold text-foreground-muted">12 Bulan</span>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-bold text-foreground">
                  {topRevenue ? `Kamar ${topRevenue.roomNumber}` : '—'}
                </h4>
                <p className="mt-1 text-2xl font-extrabold text-success">
                  {topRevenue ? `${topRevenue.amountMio.toFixed(1)} Mio` : '0.0 Mio'}
                </p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {topRevenue ? formatRupiah(topRevenue.amount) : 'Rp 0'}
                </p>
                <p className="mt-3 text-xs text-foreground-muted leading-relaxed">
                  {topRevenue?.meta || 'Tidak ada data pendapatan'}
                </p>
              </div>
            </div>

            {topRevenue && (
              <div className="mt-4 pt-3 border-t border-success/20">
                <Link
                  href={`/admin/master-data/rooms/${topRevenue.roomId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-success hover:underline"
                >
                  Detail Kamar
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* 2. Lowest Revenue Room */}
          <div className="flex flex-col justify-between rounded-xl border border-warning/30 bg-warning-subtle/20 p-4 transition-shadow hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2 py-0.5 text-[11px] font-bold text-warning">
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  Lowest Revenue
                </span>
                <span className="text-xs font-semibold text-foreground-muted">12 Bulan</span>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-bold text-foreground">
                  {lowestRevenue ? `Kamar ${lowestRevenue.roomNumber}` : '—'}
                </h4>
                <p className="mt-1 text-2xl font-extrabold text-warning">
                  {lowestRevenue ? `${lowestRevenue.amountMio.toFixed(1)} Mio` : '0.0 Mio'}
                </p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {lowestRevenue ? formatRupiah(lowestRevenue.amount) : 'Rp 0'}
                </p>
                <p className="mt-3 text-xs text-foreground-muted leading-relaxed">
                  {lowestRevenue?.meta || 'Tidak ada data pendapatan'}
                </p>
              </div>
            </div>

            {lowestRevenue && (
              <div className="mt-4 pt-3 border-t border-warning/20">
                <Link
                  href={`/admin/master-data/rooms/${lowestRevenue.roomId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-warning hover:underline"
                >
                  Evaluasi Okupansi
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* 3. Highest Maintenance Room */}
          <div className="flex flex-col justify-between rounded-xl border border-destructive/30 bg-destructive-subtle/20 p-4 transition-shadow hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-destructive/15 px-2 py-0.5 text-[11px] font-bold text-destructive">
                  <Wrench className="h-3 w-3" aria-hidden="true" />
                  Top Maintenance Cost
                </span>
                <span className="text-xs font-semibold text-foreground-muted">12 Bulan</span>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-bold text-foreground">
                  {highestMaintenance ? `Kamar ${highestMaintenance.roomNumber}` : '—'}
                </h4>
                <p className="mt-1 text-2xl font-extrabold text-destructive">
                  {highestMaintenance ? `${highestMaintenance.amountMio.toFixed(1)} Mio` : '0.0 Mio'}
                </p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {highestMaintenance ? formatRupiah(highestMaintenance.amount) : 'Rp 0'}
                </p>
                <p className="mt-3 text-xs text-foreground-muted leading-relaxed">
                  {highestMaintenance?.meta || 'Tidak ada catatan perbaikan'}
                </p>
              </div>
            </div>

            {highestMaintenance && (
              <div className="mt-4 pt-3 border-t border-destructive/20">
                <Link
                  href="/admin/reports/maintenance"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                >
                  Riwayat Servis
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* 4. Lowest Maintenance Room */}
          <div className="flex flex-col justify-between rounded-xl border border-primary/30 bg-primary-subtle/20 p-4 transition-shadow hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Lowest Maintenance
                </span>
                <span className="text-xs font-semibold text-foreground-muted">12 Bulan</span>
              </div>

              <div className="mt-3">
                <h4 className="text-sm font-bold text-foreground">
                  {lowestMaintenance ? `Kamar ${lowestMaintenance.roomNumber}` : '—'}
                </h4>
                <p className="mt-1 text-2xl font-extrabold text-primary">
                  {lowestMaintenance ? `${lowestMaintenance.amountMio.toFixed(1)} Mio` : '0.0 Mio'}
                </p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {lowestMaintenance ? formatRupiah(lowestMaintenance.amount) : 'Rp 0'}
                </p>
                <p className="mt-3 text-xs text-foreground-muted leading-relaxed">
                  {lowestMaintenance?.meta || 'Bebas perbaikan'}
                </p>
              </div>
            </div>

            {lowestMaintenance && (
              <div className="mt-4 pt-3 border-t border-primary/20">
                <Link
                  href={`/admin/master-data/rooms/${lowestMaintenance.roomId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Detail Unit Hemat
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
