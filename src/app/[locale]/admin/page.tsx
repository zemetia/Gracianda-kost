import { Badge } from '@/components/ui/Badge';
import { MetricBlock, MetricInline, MetricRow } from '@/components/ui/Metric';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate, formatNumber, formatPercent, formatRupiah, formatRupiahShort } from '@/lib/utils';
import { dashboardService } from '@/services/dashboard.service';

import { ActionQueue } from './ActionQueue';
import { RevenueChart } from './RevenueChart';

// These mirror the layout guards of the pages each metric links to
// (contracts/layout.tsx, master-data/layout.tsx, …) — a metric that leads to
// <Forbidden /> is a broken promise, not a permission check.
const CAN_SEE_FINANCE = ['SUPER_ADMIN', 'KEUANGAN'];
const CAN_SEE_MAINTENANCE = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];
const CAN_SEE_INCIDENTS = ['SUPER_ADMIN', 'SECURITY', 'OPERASIONAL'];
const CAN_SEE_ROOMS = ['SUPER_ADMIN', 'OPERASIONAL'];
const CAN_SEE_CONTRACTS = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];

/** Percentage change, or null when there is no baseline to compare against. */
function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

interface Props {
  searchParams: Promise<{ propertyId?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const { propertyId } = await searchParams;
  const session = await getSession();
  const role = session?.user.role ?? '';
  const userName = session?.user.name ?? session?.user.email ?? 'Admin';

  const showFinance = CAN_SEE_FINANCE.includes(role);
  const showMaintenance = CAN_SEE_MAINTENANCE.includes(role);
  const showIncidents = CAN_SEE_INCIDENTS.includes(role);

  // Scope comes from the global switcher in the admin layout; ?propertyId only
  // overrides it for deep links.
  const selectedPropertyId = await getPropertyScope(propertyId);

  // Aggregates are cheap enough to fetch unconditionally — only rendering is role-gated.
  const [roomStats, revenue, maintenance, incidents, revenueTrend, actionQueue] =
    await Promise.all([
      dashboardService.getRoomStats(selectedPropertyId),
      dashboardService.getRevenueThisMonth(selectedPropertyId),
      dashboardService.getMaintenanceThisMonth(selectedPropertyId),
      dashboardService.getIncidentsThisMonth(selectedPropertyId),
      dashboardService.getRevenueTrend(6, selectedPropertyId),
      dashboardService.getActionQueue(selectedPropertyId),
    ]);

  const scope = selectedPropertyId ? `&propertyId=${selectedPropertyId}` : '';
  const roomScope = selectedPropertyId ? `?propertyId=${selectedPropertyId}` : '';

  const now = new Date();
  // "Pendapatan Bulan Ini" must open this month's paid invoices — the same
  // period the number was computed from, not every paid invoice ever.
  const thisMonthScope = `&month=${now.getMonth() + 1}&year=${now.getFullYear()}`;

  const formattedDate = formatDate(now, 'id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // The trend already holds the previous period, so the comparison costs no
  // extra query. A property onboarded this month has no baseline → null, not 0%.
  const previousRevenue = revenueTrend.at(-2)?.total ?? 0;
  const revenueDelta = delta(revenue, previousRevenue);
  const trendTotal = revenueTrend.reduce((sum, point) => sum + point.total, 0);

  const occupancy = roomStats.total > 0 ? (roomStats.occupied / roomStats.total) * 100 : null;

  return (
    <div className="flex flex-col gap-12">
      {/* Page head — typography, not a banner card */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit text-[10px] uppercase tracking-wide">
            {role.replace('_', ' ')}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Halo, {userName}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-foreground-muted">
            Rangkuman operasional Gracianda House hari ini.
          </p>
        </div>
        <p className="text-xs text-foreground-muted">{formattedDate}</p>
      </header>

      {/* Work list first, numbers second — the admin opens this page to find out
          what to do, not to admire totals. */}
      <ActionQueue
        queue={actionQueue}
        propertyId={selectedPropertyId}
        showFinance={showFinance}
        showContracts={CAN_SEE_CONTRACTS.includes(role)}
        showIncidents={showIncidents}
        showRooms={CAN_SEE_ROOMS.includes(role)}
      />

      {/* Hero figure — the one number this page exists for */}
      {showFinance && (
        <section className="border-y border-border py-8">
          <MetricBlock
            label="Pendapatan Bulan Ini"
            value={formatNumber(revenue)}
            prefix="Rp"
            size="hero"
            delta={revenueDelta}
            period="vs bulan lalu"
            meta={
              previousRevenue > 0
                ? `Bulan lalu ${formatRupiah(previousRevenue)}`
                : 'Belum ada pembanding bulan lalu'
            }
            href={`/admin/payments?bucket=PAID${thisMonthScope}${scope}`}
          />
        </section>
      )}

      {/* Hunian */}
      <MetricRow columns={4} stacked={showFinance}>
        <MetricBlock
          label="Total Unit"
          value={formatNumber(roomStats.total)}
          href={`/admin/master-data/rooms${roomScope}`}
        />
        <MetricBlock
          label="Unit Terisi"
          value={formatNumber(roomStats.occupied)}
          href={`/admin/master-data/rooms?occupancy=occupied${scope}`}
        />
        <MetricBlock
          label="Unit Kosong"
          value={formatNumber(roomStats.available)}
          href={`/admin/master-data/rooms?occupancy=available${scope}`}
        />
        <MetricBlock
          label="Okupansi"
          value={occupancy === null ? '—' : formatPercent(occupancy)}
          tone={occupancy === null ? 'muted' : 'default'}
          meta={
            occupancy === null
              ? 'Belum ada unit aktif'
              : `${formatNumber(roomStats.occupied)} dari ${formatNumber(roomStats.total)} unit`
          }
        />
      </MetricRow>

      {/* Keuangan & operasional */}
      {(showFinance || showMaintenance || showIncidents) && (
        <MetricRow columns={3} stacked>
          {showFinance && (
            <MetricBlock
              label="Pembayaran Terlambat"
              value={formatNumber(actionQueue.overdue.count)}
              tone={actionQueue.overdue.count > 0 ? 'destructive' : 'muted'}
              meta={
                actionQueue.overdue.count > 0
                  ? `Nilai tunggakan ${formatRupiah(actionQueue.overdue.amount)}`
                  : 'Tidak ada tunggakan'
              }
              href={`/admin/payments?bucket=OVERDUE${scope}`}
            />
          )}
          {showMaintenance && (
            <MetricBlock
              label="Maintenance Bulan Ini"
              value={formatNumber(maintenance.count)}
              meta={`Total biaya ${formatRupiah(maintenance.totalCost)}`}
              href="/admin/maintenance"
            />
          )}
          {showIncidents && (
            <MetricBlock
              label="Insiden Bulan Ini"
              value={formatNumber(incidents.total)}
              tone={incidents.open > 0 ? 'destructive' : 'default'}
              meta={`${formatNumber(incidents.open)} masih terbuka`}
              href="/admin/incidents"
            />
          )}
        </MetricRow>
      )}

      {/* Tren pendapatan — chart supports the number, never replaces it */}
      {showFinance && (
        <section className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Tren Pendapatan · 6 Bulan
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                <span className="mr-1 text-lg font-normal text-foreground-muted">Rp</span>
                {formatNumber(trendTotal)}
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                Rata-rata {formatRupiahShort(trendTotal / revenueTrend.length)} per bulan
              </p>
            </div>
            <RevenueChart data={revenueTrend} />
          </div>

          {showIncidents && (
            <div className="lg:w-72 lg:shrink-0">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Status Laporan Insiden
              </p>
              <div className="mt-4">
                <MetricInline label="Terbuka" value={formatNumber(incidents.open)} />
                <MetricInline label="Proses" value={formatNumber(incidents.inProgress)} />
                <MetricInline label="Selesai" value={formatNumber(incidents.resolved)} />
                <MetricInline label="Total bulan ini" value={formatNumber(incidents.total)} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Insiden tanpa akses keuangan — panel berdiri sendiri */}
      {!showFinance && showIncidents && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Status Laporan Insiden
          </p>
          <div className="mt-4 max-w-md">
            <MetricInline label="Terbuka" value={formatNumber(incidents.open)} />
            <MetricInline label="Proses" value={formatNumber(incidents.inProgress)} />
            <MetricInline label="Selesai" value={formatNumber(incidents.resolved)} />
            <MetricInline label="Total bulan ini" value={formatNumber(incidents.total)} />
          </div>
        </section>
      )}
    </div>
  );
}
