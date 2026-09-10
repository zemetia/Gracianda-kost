'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils';
import { Wrench, AlertTriangle } from 'lucide-react';

interface RoomQuarterData {
  roomId: string;
  roomNumber: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  total: number;
}

interface Props {
  data: RoomQuarterData[];
}

type QuarterFilter = 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export function QuarterlyMaintenanceCard({ data }: Props) {
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilter>('ALL');

  const filtered = data
    .map((item) => {
      let count = item.total;
      if (selectedQuarter === 'Q1') count = item.q1;
      else if (selectedQuarter === 'Q2') count = item.q2;
      else if (selectedQuarter === 'Q3') count = item.q3;
      else if (selectedQuarter === 'Q4') count = item.q4;
      return {
        ...item,
        displayCount: count,
      };
    })
    .filter((item) => item.displayCount > 0)
    .sort((a, b) => b.displayCount - a.displayCount);

  const maxCount = Math.max(...filtered.map((item) => item.displayCount), 1);
  const anomalyRooms = filtered.filter((item) => item.displayCount >= 3);

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">
            Frekuensi Perawatan Kamar Per Quarter (Non-Amount)
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            Volume riil tiket perbaikan kamar untuk mendeteksi unit rentan kerusakan berulang
          </CardDescription>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as QuarterFilter[]).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setSelectedQuarter(q)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                selectedQuarter === q
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {q === 'ALL' ? 'Semua' : q}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            Tidak ada tiket perbaikan kamar yang tercatat untuk {selectedQuarter === 'ALL' ? 'seluruh periode' : selectedQuarter}.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Anomaly Callout */}
            {anomalyRooms.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-3 text-xs text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-warning">Kamar Butuh Perhatian Khusus:</span>{' '}
                  {anomalyRooms.map((r) => `Kamar ${r.roomNumber} (${r.displayCount}x)`).join(', ')}{' '}
                  memiliki intensitas service tinggi (≥ 3 kali). Pertimbangkan renovasi/penggantian unit sanitasi/AC permanen.
                </div>
              </div>
            )}

            {/* Horizontal Clustered Bar List */}
            <div className="flex flex-col gap-3">
              {filtered.map((room) => {
                const percentage = Math.min(Math.round((room.displayCount / maxCount) * 100), 100);
                const isHigh = room.displayCount >= 3;

                return (
                  <div key={room.roomId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Wrench className="h-3 w-3 text-foreground-muted" />
                        Kamar {room.roomNumber}
                      </span>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatNumber(room.displayCount)} kali servis
                        {isHigh && (
                          <span className="ml-2 rounded-full bg-destructive/10 px-1.5 py-0.2 text-[10px] text-destructive">
                            Rentan
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-raised">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`transition-all duration-300 ${
                          isHigh ? 'bg-destructive' : 'bg-primary'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
