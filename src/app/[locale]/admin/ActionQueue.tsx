import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  FileWarning,
  ShieldAlert,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { formatRupiah } from '@/lib/utils';
import type { ActionQueue as ActionQueueData } from '@/services/dashboard.service';

type Tone = 'critical' | 'warning' | 'neutral';

interface QueueItem {
  key: string;
  icon: LucideIcon;
  label: string;
  detail?: string;
  cta: string;
  href: string;
  tone: Tone;
}

const TONE_CLASS: Record<Tone, string> = {
  critical: 'text-destructive bg-destructive-subtle',
  warning: 'text-warning bg-warning-subtle',
  neutral: 'text-primary bg-primary-subtle',
};

// One flag per destination, not per widget: an item the admin can see but not
// open is worse than no item at all — it reads as a task and pays out a 403.
interface Props {
  queue: ActionQueueData;
  propertyId?: string | undefined;
  showFinance: boolean;
  showContracts: boolean;
  showIncidents: boolean;
  showRooms: boolean;
}

export function ActionQueue({
  queue,
  propertyId,
  showFinance,
  showContracts,
  showIncidents,
  showRooms,
}: Props) {
  const scope = propertyId ? `&propertyId=${propertyId}` : '';

  const items: QueueItem[] = [];

  if (showFinance && queue.overdue.count > 0) {
    items.push({
      key: 'overdue',
      icon: AlarmClock,
      label: `${queue.overdue.count} tagihan terlambat`,
      detail: formatRupiah(queue.overdue.amount),
      cta: 'Tagih sekarang',
      href: `/admin/payments?bucket=OVERDUE${scope}`,
      tone: 'critical',
    });
  }

  if (showFinance && queue.dueSoon.count > 0) {
    items.push({
      key: 'due-soon',
      icon: CalendarClock,
      label: `${queue.dueSoon.count} tagihan jatuh tempo ≤3 hari`,
      detail: formatRupiah(queue.dueSoon.amount),
      cta: 'Kirim pengingat',
      href: `/admin/payments?bucket=DUE_SOON${scope}`,
      tone: 'warning',
    });
  }

  if (showFinance && queue.missingInvoices > 0) {
    items.push({
      key: 'missing-invoices',
      icon: FileWarning,
      label: `${queue.missingInvoices} tagihan bulan ini belum dibuat`,
      cta: 'Generate tagihan',
      href: `/admin/payments${propertyId ? `?propertyId=${propertyId}` : ''}`,
      tone: 'warning',
    });
  }

  if (showContracts && queue.contractsEndingSoon > 0) {
    items.push({
      key: 'ending-soon',
      icon: CalendarClock,
      label: `${queue.contractsEndingSoon} kontrak berakhir ≤30 hari`,
      cta: 'Tawarkan perpanjangan',
      href: `/admin/contracts?ending=30${scope}`,
      tone: 'warning',
    });
  }

  if (showIncidents && queue.openIncidents > 0) {
    items.push({
      key: 'incidents',
      icon: ShieldAlert,
      label: `${queue.openIncidents} insiden belum ditangani`,
      cta: 'Tindak lanjut',
      href: `/admin/incidents?status=OPEN`,
      tone: 'critical',
    });
  }

  if (showRooms && queue.vacantRooms > 0) {
    items.push({
      key: 'vacant',
      icon: DoorOpen,
      label: `${queue.vacantRooms} unit masih kosong`,
      cta: 'Lihat unit',
      href: `/admin/master-data/rooms?occupancy=available${scope}`,
      tone: 'neutral',
    });
  }

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <CardTitle className="text-lg font-bold text-foreground">Perlu Tindakan Hari Ini</CardTitle>
        <CardDescription className="mt-1 text-xs">
          Daftar kerja yang sistem temukan sendiri — tidak perlu keliling menu untuk mencarinya.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-subtle p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">Semua beres</p>
              <p className="text-xs text-foreground-muted">
                Tidak ada tunggakan, kontrak jatuh tempo, atau insiden terbuka.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-4 py-3 transition-colors hover:bg-surface-raised/60"
                >
                  <span className={cn('shrink-0 rounded-lg p-2', TONE_CLASS[item.tone])}>
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {item.label}
                    </span>
                    {item.detail && (
                      <span className="text-xs text-foreground-muted">{item.detail}</span>
                    )}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-primary group-hover:underline sm:flex">
                    {item.cta}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-foreground-subtle sm:hidden"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
