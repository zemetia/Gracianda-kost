'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatPercent, formatRupiah, monthShortId } from '@/lib/utils';
import type { CostBreakdownComparison } from '@/services/dashboard.service';

const CATEGORY_COLORS: Record<string, string> = {
  WIFI_INTERNET: 'var(--color-chart-1, #3b82f6)',
  ELECTRICITY: 'var(--color-chart-2, #eab308)',
  WATER: 'var(--color-chart-3, #06b6d4)',
  CLEANING: 'var(--color-chart-4, #10b981)',
  MAINTENANCE: 'var(--color-chart-5, #f97316)',
  STAFF_SALARY: 'var(--color-chart-6, #8b5cf6)',
  OTHER: 'var(--color-chart-7, #64748b)',
};

const FALLBACK_COLORS = [
  '#3b82f6',
  '#eab308',
  '#06b6d4',
  '#10b981',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

interface Props {
  data: CostBreakdownComparison;
}

export function CostBreakdownCard({ data }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous'>('current');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const activeData = selectedPeriod === 'current' ? data.current : data.previous;
  const { totalCost, items, month, year } = activeData;

  const slices = items.reduce<
    Array<(typeof items)[number] & { start: number; color: string }>
  >((acc, item, index) => {
    const previous = acc[acc.length - 1];
    const start = previous ? previous.start + previous.percentage : 0;
    const color =
      CATEGORY_COLORS[item.category] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? '#64748b';
    acc.push({
      ...item,
      start,
      color,
    });
    return acc;
  }, []);

  const activeItem = items.find((i) => i.category === hoveredCategory);

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">
            Komposisi Pengeluaran Operasional
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            Distribusi biaya gedung dan perawatan per pos pengeluaran ({monthShortId(month)} {year})
          </CardDescription>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedPeriod('current')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              selectedPeriod === 'current'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('previous')}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              selectedPeriod === 'previous'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Bulan Lalu
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {totalCost === 0 || items.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            Belum ada catatan pengeluaran operasional pada periode {monthShortId(month)} {year}.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* SVG Donut Chart */}
            <div className="relative flex shrink-0 items-center justify-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 42 42"
                className="rotate-[-90deg]"
                aria-label={`Donut chart komposisi pengeluaran ${monthShortId(month)} ${year}`}
                role="img"
              >
                {/* Background track */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-surface-raised"
                />
                {slices.map((slice) => {
                  const isHovered = hoveredCategory === slice.category;
                  return (
                    <circle
                      key={slice.category}
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered ? '7.5' : '6'}
                      strokeDasharray={`${slice.percentage} ${100 - slice.percentage}`}
                      strokeDashoffset={-slice.start}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <title>{`${slice.label}: ${formatRupiah(slice.amount)} (${formatPercent(slice.percentage)})`}</title>
                    </circle>
                  );
                })}
              </svg>
              {/* Donut Center Display */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                  {activeItem ? activeItem.label : 'Total Biaya'}
                </span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {formatRupiah(activeItem ? activeItem.amount : totalCost)}
                </span>
                {activeItem && (
                  <span className="text-xs font-semibold text-primary">
                    {formatPercent(activeItem.percentage)}
                  </span>
                )}
              </div>
            </div>

            {/* Legend & Breakdown List */}
            <div className="w-full flex-1 divide-y divide-border/40">
              {items.map((item, idx) => {
                const color =
                  CATEGORY_COLORS[item.category] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length] ?? '#64748b';
                const isHovered = hoveredCategory === item.category;
                return (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between py-2.5 px-2 rounded-md transition-colors cursor-pointer ${
                      isHovered ? 'bg-surface-raised' : 'hover:bg-surface-raised/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold tabular-nums text-foreground">
                        {formatRupiah(item.amount)}
                      </span>
                      <span className="w-12 text-right text-xs tabular-nums text-foreground-muted">
                        {formatPercent(item.percentage)}
                      </span>
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
