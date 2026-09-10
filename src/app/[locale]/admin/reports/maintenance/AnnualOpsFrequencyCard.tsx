'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatNumber, monthShortId } from '@/lib/utils';
import type { YearlyOpsFrequencyResult } from '@/services/dashboard.service';
import { Wrench, ShieldAlert, TrendingUp } from 'lucide-react';

interface Props {
  data: YearlyOpsFrequencyResult;
}

export function AnnualOpsFrequencyCard({ data }: Props) {
  const { year, months, busiestMaintenanceMonth, busiestIncidentMonth } = data;

  const maxVal = Math.max(
    ...months.flatMap((m) => [m.maintenanceCount, m.incidentCount]),
    1,
  );

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Rekapitulasi Frekuensi: Maintenance &amp; Insiden 1 Tahun ({year})
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Kuantitas volume kejadian untuk mengukur kestabilan operasional kamar kos
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-info">
              <span className="h-2.5 w-2.5 rounded-full bg-info" />
              Maintenance (Servis)
            </span>
            <span className="flex items-center gap-1.5 text-destructive">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              Insiden (Gangguan)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          {/* Insights banner */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-surface/40 p-3 sm:flex-row sm:items-center sm:justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>
                Bulan paling aktif servis:{' '}
                <strong className="text-info">{monthShortId(busiestMaintenanceMonth)} {year}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span>
                Bulan paling rawan komplain/insiden:{' '}
                <strong className="text-destructive">{monthShortId(busiestIncidentMonth)} {year}</strong>
              </span>
            </div>
          </div>

          {/* Grouped Bar Visual (Dual Column per month) */}
          <div className="flex flex-col gap-2 overflow-x-auto pb-2">
            <div className="min-w-[480px] sm:min-w-0">
              <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end h-40 pt-4 px-2 border-b border-border">
                {months.map((m) => {
                  const maintHeight = Math.min(Math.round((m.maintenanceCount / maxVal) * 100), 100);
                  const incHeight = Math.min(Math.round((m.incidentCount / maxVal) * 100), 100);

                  return (
                    <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                      <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center h-full pb-1">
                        {/* Maintenance bar (Blue) */}
                        <div
                          style={{ height: `${maintHeight}%` }}
                          className="w-2 sm:w-3.5 rounded-t-xs bg-info transition-all duration-300 min-h-[2px]"
                          title={`${monthShortId(m.month)}: ${m.maintenanceCount} maintenance`}
                        />
                        {/* Incident bar (Red) */}
                        <div
                          style={{ height: `${incHeight}%` }}
                          className="w-2 sm:w-3.5 rounded-t-xs bg-destructive transition-all duration-300 min-h-[2px]"
                          title={`${monthShortId(m.month)}: ${m.incidentCount} insiden`}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs text-foreground-muted font-medium pt-1">
                        {monthShortId(m.month)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mini Summary Table */}
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bulan</TableHead>
                  <TableHead className="text-right">Total Maintenance</TableHead>
                  <TableHead className="text-right">Total Insiden</TableHead>
                  <TableHead className="text-right">Rata-rata Kejadian / Kamar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-semibold text-foreground">
                      {monthShortId(m.month)} {m.year}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-info font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {formatNumber(m.maintenanceCount)} kali
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive font-medium">
                      <span className="inline-flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        {formatNumber(m.incidentCount)} kejadian
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-foreground-muted">
                      {m.avgEventsPerRoom > 0 ? `${m.avgEventsPerRoom} / kamar` : '0'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
