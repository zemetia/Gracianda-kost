import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { getSession } from '@/lib/auth';
import { dashboardService } from '@/services/dashboard.service';

import { RevenueChart } from './RevenueChart';

const CAN_SEE_FINANCE = ['SUPER_ADMIN', 'KEUANGAN'];
const CAN_SEE_MAINTENANCE = ['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN'];
const CAN_SEE_INCIDENTS = ['SUPER_ADMIN', 'SECURITY', 'OPERASIONAL'];

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <Typography variant="muted">{label}</Typography>
        <Typography variant="h3">{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  const role = session?.user.role ?? '';

  const showFinance = CAN_SEE_FINANCE.includes(role);
  const showMaintenance = CAN_SEE_MAINTENANCE.includes(role);
  const showIncidents = CAN_SEE_INCIDENTS.includes(role);

  // Aggregates are cheap enough to fetch unconditionally — only rendering is role-gated.
  const [roomStats, revenue, overdueCount, maintenance, incidents, revenueTrend] = await Promise.all([
    dashboardService.getRoomStats(),
    dashboardService.getRevenueThisMonth(),
    dashboardService.getOverdueCount(),
    dashboardService.getMaintenanceThisMonth(),
    dashboardService.getIncidentsThisMonth(),
    dashboardService.getRevenueTrend(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Dashboard
        </Typography>
        <Typography variant="muted">Ringkasan okupansi, keuangan, dan operasional.</Typography>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Total Kamar" value={String(roomStats.total)} />
        <StatTile label="Kamar Terisi" value={String(roomStats.occupied)} />
        <StatTile label="Kamar Kosong" value={String(roomStats.available)} />
        {showFinance && <StatTile label="Pendapatan Bulan Ini" value={`Rp ${revenue.toLocaleString('id-ID')}`} />}
        {showFinance && <StatTile label="Pembayaran Terlambat" value={String(overdueCount)} />}
        {showMaintenance && (
          <StatTile
            label="Maintenance Bulan Ini"
            value={`${maintenance.count} (Rp ${maintenance.totalCost.toLocaleString('id-ID')})`}
          />
        )}
      </div>

      {showFinance && (
        <Card>
          <CardHeader>
            <CardTitle>Tren Pendapatan (6 Bulan)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueTrend} />
          </CardContent>
        </Card>
      )}

      {showIncidents && (
        <Card>
          <CardHeader>
            <CardTitle>Insiden Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge variant="secondary">Total: {incidents.total}</Badge>
            <Badge variant="destructive">Terbuka: {incidents.open}</Badge>
            <Badge variant="warning">Diproses: {incidents.inProgress}</Badge>
            <Badge variant="success">Selesai: {incidents.resolved}</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
