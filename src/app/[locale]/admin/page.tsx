import { Badge } from '@/components/ui/Badge';
import { MetricBlock, MetricInline, MetricRow } from '@/components/ui/Metric';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate, formatNumber, formatPercent, formatRupiah } from '@/lib/utils';
import { dashboardService } from '@/services/dashboard.service';

import { ActionQueue } from './ActionQueue';
import { CostBreakdownCard } from './CostBreakdownCard';
import { DashboardPanel } from './DashboardPanel';
import { HeadcountChart } from './HeadcountChart';
import { MaintenanceIncidentChart } from './MaintenanceIncidentChart';
import { QuarterlyFinancialCard } from './QuarterlyFinancialCard';
import { QuarterRevenueCostChart } from './QuarterRevenueCostChart';
import { ScheduleWidget } from './ScheduleWidget';

// These mirror the layout guards of the pages each metric links to
// (contracts/layout.tsx, master-data/layout.tsx, …) — a metric that leads to
// <Forbidden /> is a broken promise, not a permission check.
const CAN_SEE_FINANCE = ['SUPER_ADMIN', 'KEUANGAN'];
const CAN_SEE_MAINTENANCE = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];
const CAN_SEE_INCIDENTS = ['SUPER_ADMIN', 'SECURITY', 'OPERASIONAL'];
const CAN_SEE_ROOMS = ['SUPER_ADMIN', 'OPERASIONAL'];
const CAN_SEE_CONTRACTS = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];
// Mirrors admin/schedule/page.tsx's own layout guard.
const CAN_SEE_SCHEDULE = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];

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
  const showSchedule = CAN_SEE_SCHEDULE.includes(role);

  // Scope comes from the global switcher in the admin layout; ?propertyId only
  // overrides it for deep links.
  const selectedPropertyId = await getPropertyScope(propertyId);

  // Aggregates are cheap enough to fetch unconditionally — only rendering is role-gated.
  const [
    roomStats,
    revenue,
    maintenance,
    incidents,
    revenueTrend,
    actionQueue,
    headcountStats,
    headcountTrend,
    costBreakdown,
    quarterlySummary,
    maintenanceIncidentTrend,
    schedule,
  ] = await Promise.all([
    dashboardService.getRoomStats(selectedPropertyId),
    dashboardService.getRevenueThisMonth(selectedPropertyId),
    dashboardService.getMaintenanceThisMonth(selectedPropertyId),
    dashboardService.getIncidentsThisMonth(selectedPropertyId),
    dashboardService.getRevenueTrend(6, selectedPropertyId),
    dashboardService.getActionQueue(selectedPropertyId),
    dashboardService.getHeadcountStats(selectedPropertyId),
    dashboardService.getHeadcountTrend(6, selectedPropertyId),
    dashboardService.getCostBreakdown(selectedPropertyId),
    dashboardService.getQuarterlyFinancialSummary(selectedPropertyId),
    dashboardService.getMaintenanceIncidentTrend(6, selectedPropertyId),
    dashboardService.getOperationalSchedule(selectedPropertyId),
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

  const occupancy = roomStats.total > 0 ? (roomStats.occupied / roomStats.total) * 100 : null;

  // Headcount = tenant + occupants per active contract, never assumed from
  // room count — see dashboardService.getHeadcountStats.
  const headcount = headcountStats.current;
  const previousHeadcount = headcountStats.previous;
  const capacityTotal = headcount.roomsTotal * 2;
  const previousCapacityTotal = previousHeadcount.roomsTotal * 2;
  const capacityOccupancy = capacityTotal > 0 ? (headcount.totalPeople / capacityTotal) * 100 : null;
  const previousCapacityOccupancy =
    previousCapacityTotal > 0 ? (previousHeadcount.totalPeople / previousCapacityTotal) * 100 : null;
  const headcountDelta = delta(headcount.totalPeople, previousHeadcount.totalPeople);
  const capacityOccupancyDelta =
    capacityOccupancy !== null && previousCapacityOccupancy !== null
      ? delta(capacityOccupancy, previousCapacityOccupancy)
      : null;

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

      {/* Overview grid — the four things this page exists to answer at a
          glance (penyewa, keuangan, jadwal, operasional). Responsive:
          1 column on mobile, 2 on tablet+, so panels never get crushed. */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <DashboardPanel
          title="Penyewa per Bulan (Total)"
          description={`${formatNumber(headcount.totalPeople)} orang bulan ini`}
          href={`/admin/master-data/rooms?occupancy=occupied${scope}`}
        >
          <HeadcountChart data={headcountTrend} />
        </DashboardPanel>

        {showFinance && (
          <DashboardPanel
            title="Sum of Costs and Revenue"
            description="Dalam jutaan rupiah (Mio), per kuartal"
            href={`/admin/payments${roomScope}`}
          >
            <div className="mb-2 flex items-center gap-4 text-[10px] font-medium text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
                Cost
              </span>
            </div>
            <QuarterRevenueCostChart data={quarterlySummary.quarters} />
          </DashboardPanel>
        )}

        {showSchedule && (
          <DashboardPanel title="Jadwal Bulan Ini" href={`/admin/schedule${roomScope}`}>
            <ScheduleWidget
              month={schedule.month}
              year={schedule.year}
              events={schedule.events}
              propertyId={selectedPropertyId}
            />
          </DashboardPanel>
        )}

        {(showMaintenance || showIncidents) && (
          <DashboardPanel
            title="Maintenance & Kejadian"
            description="6 bulan terakhir"
            href="/admin/maintenance"
          >
            <div className="mb-2 flex items-center gap-4 text-[10px] font-medium text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                Maintenance
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                Insiden
              </span>
            </div>
            <MaintenanceIncidentChart data={maintenanceIncidentTrend} />
          </DashboardPanel>
        )}
      </section>

      {/* Perlu Tindakan Hari Ini — di bawah grid overview, tetap di atas
          rincian metrik (admin-flow principle #1: antrean aksi di atas
          statistik). */}
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

      {/* Penyewa Per Bulan — headcount total (penyewa + penghuni tambahan),
          bukan asumsi 1 kamar = 1 orang */}
      <section className="-mt-px border-y border-border py-8">
        <MetricBlock
          label="Total Penyewa"
          value={formatNumber(headcount.totalPeople)}
          suffix="Orang"
          size="hero"
          delta={headcountDelta}
          period="vs bulan lalu"
          meta={`Dari kapasitas maksimal ${formatNumber(capacityTotal)} Orang`}
          href={`/admin/master-data/rooms?occupancy=occupied${scope}`}
        />
      </section>

      <MetricRow columns={2} stacked>
        <MetricBlock
          label="Kamar Terisi"
          value={`${formatNumber(headcount.roomsOccupied)}/${formatNumber(headcount.roomsTotal)}`}
          meta={`${formatNumber(headcount.doubleOccupancy)} kamar isi 2 orang, ${formatNumber(headcount.singleOccupancy)} kamar isi 1 orang`}
          href={`/admin/master-data/rooms?occupancy=occupied${scope}`}
        />
        <MetricBlock
          label="Okupansi Kapasitas"
          value={capacityOccupancy === null ? '—' : formatPercent(capacityOccupancy)}
          tone={capacityOccupancy === null ? 'muted' : 'default'}
          delta={capacityOccupancyDelta}
          period="vs bulan lalu"
          meta={`${formatNumber(headcount.totalPeople)} dari ${formatNumber(capacityTotal)} kapasitas`}
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

      {/* Status Laporan Insiden — rincian buka/proses/selesai, di luar tren
          yang sudah tampil di panel Maintenance & Kejadian */}
      {showIncidents && (
        <section className="max-w-md">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Status Laporan Insiden
          </p>
          <div className="mt-4">
            <MetricInline label="Terbuka" value={formatNumber(incidents.open)} />
            <MetricInline label="Proses" value={formatNumber(incidents.inProgress)} />
            <MetricInline label="Selesai" value={formatNumber(incidents.resolved)} />
            <MetricInline label="Total bulan ini" value={formatNumber(incidents.total)} />
          </div>
        </section>
      )}

      {/* Komposisi Biaya Operasional */}
      {showFinance && (
        <section>
          <CostBreakdownCard data={costBreakdown} />
        </section>
      )}

      {/* Ringkasan Finansial per Kuartal (Slide 1a) */}
      {showFinance && (
        <section>
          <QuarterlyFinancialCard summary={quarterlySummary} />
        </section>
      )}

    </div>
  );
}
