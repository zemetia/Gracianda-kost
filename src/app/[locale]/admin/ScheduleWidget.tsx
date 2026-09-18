import { Link } from '@/i18n/navigation';
import { monthShortId } from '@/lib/utils';
import type { ScheduleEvent } from '@/services/dashboard.service';

interface Props {
  month: number;
  year: number;
  events: ScheduleEvent[];
  propertyId?: string;
}

// Read-only preview of the full /admin/schedule calendar — no interactivity,
// so this stays a Server Component. Meant to sit inside DashboardPanel on the
// overview grid; clicking any day, or the panel's own "Lihat semua" link,
// goes to the real calendar (admin-flow principle #4 in THIS.md: every
// dashboard figure links to what answers it).
export function ScheduleWidget({ month, year, events, propertyId }: Props) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const scope = propertyId ? `&propertyId=${propertyId}` : '';

  const eventsByDay = new Map<number, ScheduleEvent[]>();
  for (const e of events) {
    const d = new Date(e.date).getDate();
    const list = eventsByDay.get(d) ?? [];
    list.push(e);
    eventsByDay.set(d, list);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const upcoming = events
    .filter((e) => !isCurrentMonth || new Date(e.date).getDate() >= today.getDate())
    .slice(0, 4);

  return (
    <>
      <Link
        href={`/admin/schedule?month=${month}&year=${year}${scope}`}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
          {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
            <div
              key={i}
              className="bg-surface py-1 text-center text-[9px] font-semibold text-foreground-muted"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-surface/50 p-1" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = eventsByDay.get(dayNum) ?? [];
            const isToday = isCurrentMonth && today.getDate() === dayNum;

            return (
              <div
                key={`day-${dayNum}`}
                className={`flex min-h-[28px] flex-col items-center justify-center gap-0.5 bg-surface p-0.5 ${
                  isToday ? 'ring-1 ring-inset ring-primary' : ''
                }`}
              >
                <span className="text-[10px] font-medium tabular-nums text-foreground">
                  {dayNum}
                </span>
                {dayEvents.length > 0 && (
                  <span className="flex gap-0.5" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className="h-1 w-1 rounded-full bg-primary" />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Link>

      <p className="mt-4 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
        {monthShortId(month)} {year}
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {upcoming.length === 0 ? (
          <p className="text-xs text-foreground-muted">Tidak ada agenda tersisa bulan ini.</p>
        ) : (
          upcoming.map((e) => (
            <Link
              key={e.id}
              href={`/admin/schedule?month=${month}&year=${year}${scope}`}
              className="group flex items-baseline gap-2 text-xs"
            >
              <span className="shrink-0 font-semibold tabular-nums text-foreground">
                {new Date(e.date).getDate()}.
              </span>
              <span className="min-w-0 truncate text-foreground-muted group-hover:text-foreground">
                {e.title}
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
ScheduleWidget.displayName = 'ScheduleWidget';
