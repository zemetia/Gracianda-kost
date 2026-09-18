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

import { SendWaButton } from './payments/SendWaButton';

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

  const urgentList = (queue.urgentItems ?? []).filter((item) => {
    if ((item.type === 'PAYMENT_OVERDUE' || item.type === 'PAYMENT_DUE_TODAY') && !showFinance) {
      return false;
    }
    if (item.type === 'CRITICAL_INCIDENT' && !showIncidents) {
      return false;
    }
    return true;
  });

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">Perlu Tindakan Hari Ini</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Daftar kerja yang sistem temukan sendiri — tidak perlu keliling menu untuk mencarinya.
            </CardDescription>
          </div>
          {urgentList.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
              ⚠️ {urgentList.length} Mendesak
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              ✅ Zero Issue
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Conditional Alert Box: Only when urgent items exist */}
        {urgentList.length > 0 && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive-subtle/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-destructive/20 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  ⚠️ {urgentList.length} Tindakan Mendesak Hari Ini
                </h3>
                <p className="text-xs text-foreground-muted">
                  Memerlukan intervensi langsung hari ini oleh pengelola kos.
                </p>
              </div>
              <span className="rounded-md bg-destructive text-destructive-foreground px-2 py-0.5 text-[11px] font-semibold">
                Action Required
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {urgentList.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-lg border border-border/80 bg-surface p-3 shadow-xs"
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold',
                          item.severity === 'critical'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-warning/15 text-warning',
                        )}
                      >
                        {item.type === 'PAYMENT_OVERDUE' && 'Telat Bayar'}
                        {item.type === 'PAYMENT_DUE_TODAY' && 'Jatuh Tempo Hari Ini'}
                        {item.type === 'MAINTENANCE_TODAY' && 'Maintenance Hari Ini'}
                        {item.type === 'CRITICAL_INCIDENT' && 'Insiden Kritis'}
                      </span>
                      {item.roomNumber && (
                        <span className="text-xs font-medium text-foreground-muted">
                          Kamar {item.roomNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{item.title}</p>
                    <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5">{item.detail}</p>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-end">
                    {item.paymentDetails ? (
                      <SendWaButton
                        paymentId={item.paymentDetails.paymentId}
                        phone={item.paymentDetails.phone}
                        tenantName={item.paymentDetails.tenantName}
                        contractCode={item.paymentDetails.contractCode}
                        roomNumber={item.paymentDetails.roomNumber}
                        periodMonth={item.paymentDetails.periodMonth}
                        periodYear={item.paymentDetails.periodYear}
                        amountDue={item.paymentDetails.amountDue}
                        amountPaid={item.paymentDetails.amountPaid}
                        dueDate={item.paymentDetails.dueDate}
                        size="sm"
                        label="Kirim Reminder WA"
                      />
                    ) : (
                      <Link
                        href={item.actionHref}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                      >
                        {item.actionLabel}
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clean State: Zero urgent issues today */}
        {urgentList.length === 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/20 bg-success-subtle p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">Semua Beres</p>
              <p className="text-xs text-foreground-muted">
                ✅ Semua operasional hari ini beres. Tidak ada tindakan mendesak.
              </p>
            </div>
          </div>
        )}

        {/* General Queue Worklist */}
        {items.length > 0 && (
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
