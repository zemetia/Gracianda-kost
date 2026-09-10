'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatNumber, formatPercent } from '@/lib/utils';
import type { IncidentCategory } from '@/generated/prisma/client';
import { ShieldAlert, Clock } from 'lucide-react';

interface CategoryStat {
  category: IncidentCategory;
  count: number;
  percentage: number;
  avgResolutionHours: number | null;
}

interface Props {
  stats: CategoryStat[];
  total: number;
  avgResolutionHoursOverall: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  PELANGGARAN_ATURAN: 'Ketertiban & Pelanggaran Aturan',
  GANGGUAN: 'Gangguan & Kenyamanan',
  KERUSAKAN: 'Kerusakan Fasilitas / Gedung',
  KEHILANGAN: 'Keamanan & Akses / Kehilangan',
  KELUHAN_PENGHUNI: 'Keluhan & Komplain Penghuni',
  LAPORAN_SECURITY: 'Laporan Petugas Security',
};

function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 24) return `${hours} jam`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} hari`;
}

export function IncidentRiskChart({ stats, total, avgResolutionHoursOverall }: Props) {
  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Manajemen Risiko: Insiden Berdasarkan Kategori
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Distribusi keluhan dan gangguan operasional untuk evaluasi SOP dan mitigasi risiko
            </CardDescription>
          </div>
          {avgResolutionHoursOverall !== null && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>
                Rata-rata Penyelesaian:{' '}
                <strong className="text-foreground">{formatHours(avgResolutionHoursOverall)}</strong>
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {total === 0 || stats.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            Tidak ada data laporan insiden pada periode ini.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {stats.map((stat) => {
              const label = CATEGORY_LABELS[stat.category] ?? stat.category;
              const barWidth = Math.min(Math.round((stat.count / maxCount) * 100), 100);

              return (
                <div key={stat.category} className="flex flex-col gap-1.5 rounded-lg border border-border/60 p-3 hover:bg-surface-raised/40 transition-colors">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                      <span>{label}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 tabular-nums">
                      <span className="font-bold text-foreground">
                        {formatNumber(stat.count)} kasus ({formatPercent(stat.percentage)})
                      </span>
                      <span className="text-[11px] text-foreground-muted">
                        Penyelesaian: {formatHours(stat.avgResolutionHours)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="bg-primary transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
