'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatDate, formatRupiah, monthShortId } from '@/lib/utils';
import type { ScheduleEvent, ScheduleEventType } from '@/services/dashboard.service';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface Props {
  month: number;
  year: number;
  events: ScheduleEvent[];
  propertyId?: string;
}

type CategoryFilter = 'ALL' | 'PAYMENT' | 'MAINTENANCE' | 'CONTRACT';
type ViewMode = 'MONTH' | 'AGENDA';

const EVENT_COLOR: Record<ScheduleEventType, { bg: string; text: string; dot: string; label: string }> = {
  PAYMENT_PAID: {
    bg: 'bg-success/15',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Tagihan Lunas',
  },
  PAYMENT_DUE_SOON: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Jatuh Tempo (≤ 7 Hari)',
  },
  PAYMENT_OVERDUE: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    dot: 'bg-destructive',
    label: 'Tagihan Telat',
  },
  PAYMENT_UPCOMING: {
    bg: 'bg-surface-raised',
    text: 'text-foreground-muted',
    dot: 'bg-foreground-muted',
    label: 'Belum Jatuh Tempo',
  },
  MAINTENANCE: {
    bg: 'bg-info/15',
    text: 'text-info',
    dot: 'bg-info',
    label: 'Maintenance Terjadwal',
  },
  CONTRACT_END: {
    bg: 'bg-primary/15',
    text: 'text-primary',
    dot: 'bg-primary',
    label: 'Kontrak Berakhir',
  },
};

export function ScheduleCalendarView({ month, year, events, propertyId }: Props) {
  const [filter, setFilter] = useState<CategoryFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Month navigation helpers
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const propQuery = propertyId ? `&propertyId=${propertyId}` : '';

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (filter === 'PAYMENT') return e.type.startsWith('PAYMENT');
    if (filter === 'MAINTENANCE') return e.type === 'MAINTENANCE';
    if (filter === 'CONTRACT') return e.type === 'CONTRACT_END';
    return true;
  });

  // Days in month calculation
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

  // Group events by day (1..daysInMonth)
  const eventsByDay = new Map<number, ScheduleEvent[]>();
  for (const e of filteredEvents) {
    const d = new Date(e.date).getDate();
    const list = eventsByDay.get(d) ?? [];
    list.push(e);
    eventsByDay.set(d, list);
  }

  const selectedDayNum = selectedDate ? Number(selectedDate.split('-')[2]) : null;
  const selectedDayEvents = selectedDayNum ? eventsByDay.get(selectedDayNum) ?? [] : [];

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="flex flex-col gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">
            Timeline &amp; Kalender Operasional
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            Jadwal terpadu jatuh tempo sewa, agenda service rutin, dan berakhirnya masa sewa kamar
          </CardDescription>
        </div>

        {/* Controls: Nav, Views, Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Navigator */}
          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 text-xs">
            <Link
              href={`/admin/schedule?month=${prevMonth}&year=${prevYear}${propQuery}`}
              className="rounded p-1 text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              aria-label="Bulan Lalu"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="px-2 font-bold tabular-nums text-foreground">
              {monthShortId(month)} {year}
            </span>
            <Link
              href={`/admin/schedule?month=${nextMonth}&year=${nextYear}${propQuery}`}
              className="rounded p-1 text-foreground-muted hover:bg-surface-raised hover:text-foreground"
              aria-label="Bulan Depan"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('MONTH')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'MONTH'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Kalender
            </button>
            <button
              type="button"
              onClick={() => setViewMode('AGENDA')}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === 'AGENDA'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {(['ALL', 'PAYMENT', 'MAINTENANCE', 'CONTRACT'] as CategoryFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  filter === f
                    ? 'bg-surface-raised text-foreground font-bold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {f === 'ALL'
                  ? 'Semua'
                  : f === 'PAYMENT'
                  ? 'Tagihan'
                  : f === 'MAINTENANCE'
                  ? 'Servis'
                  : 'Kontrak'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Color Marker Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-success">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            Tagihan Lunas
          </span>
          <span className="flex items-center gap-1.5 text-warning">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            Jatuh Tempo (≤ 7 Hari)
          </span>
          <span className="flex items-center gap-1.5 text-destructive">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            Telat
          </span>
          <span className="flex items-center gap-1.5 text-info">
            <span className="h-2.5 w-2.5 rounded-full bg-info" />
            Maintenance Rutin
          </span>
          <span className="flex items-center gap-1.5 text-primary">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Kontrak Berakhir
          </span>
        </div>

        {viewMode === 'MONTH' ? (
          <div className="flex flex-col gap-6">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px rounded-xl border border-border bg-border overflow-hidden">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div
                  key={day}
                  className="bg-surface py-2 text-center text-xs font-semibold text-foreground-muted"
                >
                  {day}
                </div>
              ))}

              {/* Leading empty cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] bg-surface/50 p-1 sm:p-2" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayEvents = eventsByDay.get(dayNum) ?? [];
                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDate === dateKey;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    className={`flex flex-col min-h-[85px] p-1.5 sm:p-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-surface-raised ring-2 ring-primary ring-inset'
                        : 'bg-surface hover:bg-surface-raised/60'
                    }`}
                  >
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {dayNum}
                    </span>

                    {/* Event Dots / Chips */}
                    <div className="mt-1 flex flex-col gap-1 w-full overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const style = EVENT_COLOR[ev.type];
                        return (
                          <div
                            key={ev.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${style.bg} ${style.text}`}
                            title={ev.title}
                          >
                            {ev.roomNumber !== 'Gedung' ? `Km ${ev.roomNumber}` : 'Gedung'}: {ev.statusLabel}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] font-semibold text-foreground-muted">
                          +{dayEvents.length - 2} agenda
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Popover / Detail View for Selected Date */}
            {selectedDate && (
              <div className="rounded-xl border border-primary/40 bg-surface/80 p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    Agenda Tanggal {selectedDayNum ? formatDate(new Date(year, month - 1, selectedDayNum)) : ''}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(null)}
                    className="text-xs font-semibold text-foreground-muted hover:text-foreground"
                  >
                    Tutup
                  </button>
                </div>

                {selectedDayEvents.length === 0 ? (
                  <p className="pt-3 text-xs text-foreground-muted">
                    Tidak ada jadwal pembayaran, perawatan, atau berakhir sewa pada tanggal ini.
                  </p>
                ) : (
                  <div className="mt-3 divide-y divide-border/40">
                    {selectedDayEvents.map((ev) => {
                      const style = EVENT_COLOR[ev.type];
                      return (
                        <div key={ev.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                            <span className="font-bold text-foreground">{ev.title}</span>
                            {ev.tenantName && (
                              <span className="text-foreground-muted">({ev.tenantName} - {ev.tenantPhone})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {ev.amount !== undefined && (
                              <span className="font-bold tabular-nums text-foreground">
                                {formatRupiah(ev.amount)}
                              </span>
                            )}
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                              {ev.statusLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Weekly / Agenda List View */
          <div className="flex flex-col divide-y divide-border/40">
            {filteredEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-foreground-muted">
                Tidak ada agenda operasional yang cocok dengan filter untuk {monthShortId(month)} {year}.
              </p>
            ) : (
              filteredEvents.map((ev) => {
                const style = EVENT_COLOR[ev.type];
                return (
                  <div
                    key={ev.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-raised/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-surface text-center">
                        <span className="text-[10px] uppercase font-bold text-foreground-muted">
                          {monthShortId(new Date(ev.date).getMonth() + 1)}
                        </span>
                        <span className="text-sm font-extrabold leading-none tabular-nums text-foreground">
                          {new Date(ev.date).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                        <p className="text-xs text-foreground-muted">
                          {ev.tenantName ? `${ev.tenantName} · ${ev.tenantPhone ?? ''}` : ev.description ?? ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {ev.amount !== undefined && (
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {formatRupiah(ev.amount)}
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
                        {ev.statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
