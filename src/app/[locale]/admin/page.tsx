import type { LucideIcon } from 'lucide-react';
import {
  DoorOpen,
  Users,
  TrendingUp,
  Wrench,
  ShieldAlert,
  Sparkles,
  Wallet,
  Calendar,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { getSession } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { getPropertyScope } from '@/lib/property-scope';
import { dashboardService } from '@/services/dashboard.service';
import { Link } from '@/i18n/navigation';

import { ActionQueue } from './ActionQueue';
import { RevenueChart } from './RevenueChart';

// These mirror the layout guards of the pages each widget links to
// (contracts/layout.tsx, master-data/layout.tsx, …) — a tile that leads to
// <Forbidden /> is a broken promise, not a permission check.
const CAN_SEE_FINANCE = ['SUPER_ADMIN', 'KEUANGAN'];
const CAN_SEE_MAINTENANCE = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];
const CAN_SEE_INCIDENTS = ['SUPER_ADMIN', 'SECURITY', 'OPERASIONAL'];
const CAN_SEE_ROOMS = ['SUPER_ADMIN', 'OPERASIONAL'];
const CAN_SEE_CONTRACTS = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];

// Every number on this dashboard is a question ("which ones?"), so every tile
// links to the list that answers it.
function StatTile({
  label,
  value,
  icon: Icon,
  href,
  colorClass = 'text-primary bg-primary-subtle',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  href: string;
  colorClass?: string;
}) {
  return (
    <Link href={href} className="group focus-visible:outline-none">
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/80 group-hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-ring h-full">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex flex-col gap-1.5 min-w-0">
            <Typography variant="muted" className="text-xs uppercase tracking-wider font-semibold truncate">
              {label}
            </Typography>
            <Typography variant="h3" className="font-bold text-foreground truncate">
              {value}
            </Typography>
          </div>
          <div className={cn('p-3 rounded-xl shrink-0', colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
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

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Premium Welcome Banner */}
      <div className="rounded-2xl border border-gradient bg-card p-6 md:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary-subtle text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
              {role.replace('_', ' ')}
            </Badge>
          </div>
          <Typography variant="h2" className="text-foreground font-bold tracking-tight">
            Halo, {userName}! 👋
          </Typography>
          <Typography variant="muted" className="text-sm max-w-xl leading-relaxed">
            Selamat datang kembali di portal pengelolaan Gracianda House. Berikut adalah rangkuman performa operasional Anda.
          </Typography>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-muted font-medium bg-surface-raised px-4 py-2.5 rounded-xl border border-border shrink-0">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span>{formattedDate}</span>
        </div>
      </div>

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

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatTile
          label="Total Unit"
          value={String(roomStats.total)}
          icon={DoorOpen}
          href={`/admin/master-data/rooms${roomScope}`}
          colorClass="text-primary bg-primary-subtle"
        />
        <StatTile
          label="Unit Terisi"
          value={String(roomStats.occupied)}
          icon={Users}
          href={`/admin/master-data/rooms?occupancy=occupied${scope}`}
          colorClass="text-success bg-success-subtle"
        />
        <StatTile
          label="Unit Kosong"
          value={String(roomStats.available)}
          icon={Sparkles}
          href={`/admin/master-data/rooms?occupancy=available${scope}`}
          colorClass="text-warning bg-warning-subtle"
        />
        {showFinance && (
          <StatTile
            label="Pendapatan Bulan Ini"
            value={`Rp ${revenue.toLocaleString('id-ID')}`}
            icon={Wallet}
            href={`/admin/payments?bucket=PAID${thisMonthScope}${scope}`}
            colorClass="text-success bg-success-subtle"
          />
        )}
        {showFinance && (
          <StatTile
            label="Pembayaran Terlambat"
            value={String(actionQueue.overdue.count)}
            icon={ShieldAlert}
            href={`/admin/payments?bucket=OVERDUE${scope}`}
            colorClass="text-destructive bg-destructive-subtle"
          />
        )}
        {showMaintenance && (
          <StatTile
            label="Maintenance Bulan Ini"
            value={`${maintenance.count} (Rp ${maintenance.totalCost.toLocaleString('id-ID')})`}
            icon={Wrench}
            href="/admin/maintenance"
            colorClass="text-primary bg-primary-subtle"
          />
        )}
      </div>

      {/* Revenue Trend Chart & Incident Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {showFinance && (
          <Card className="lg:col-span-2 border-border/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Tren Pendapatan (6 Bulan)</CardTitle>
                <CardDescription className="text-xs mt-1">Visualisasi billing sewa yang terkumpul</CardDescription>
              </div>
              <div className="h-9 w-9 rounded-lg bg-success-subtle text-success flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <RevenueChart data={revenueTrend} />
            </CardContent>
          </Card>
        )}

        {showIncidents && (
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-bold text-foreground">Status Laporan Insiden</CardTitle>
              <CardDescription className="text-xs mt-1">Laporan pengaduan keamanan dan operasional</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-center justify-between p-4 bg-surface-raised rounded-xl border border-border">
                <span className="text-sm font-medium text-foreground-muted">Total Laporan</span>
                <span className="text-lg font-bold text-foreground">{incidents.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center p-3 bg-destructive-subtle/40 rounded-xl border border-destructive/20 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-destructive">Terbuka</span>
                  <span className="text-lg font-bold text-destructive mt-1">{incidents.open}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-warning-subtle/40 rounded-xl border border-warning/20 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-warning">Proses</span>
                  <span className="text-lg font-bold text-warning mt-1">{incidents.inProgress}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-success-subtle/40 rounded-xl border border-success/20 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-success">Selesai</span>
                  <span className="text-lg font-bold text-success mt-1">{incidents.resolved}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
