import { MetricBlock, MetricRow } from '@/components/ui/Metric';
import { Typography } from '@/components/ui/Typography';
import { canAccess } from '@/lib/auth';
import { formatNumber } from '@/lib/utils';
import { reportService } from '@/services/report.service';
import { roomService } from '@/services/room.service';

import { Forbidden } from '../../Forbidden';
import { ReportFilterBar } from '../ReportFilterBar';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; floorId?: string }>;
}

export default async function TenantsReportPage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'OPERASIONAL']))) return <Forbidden />;
  const { from, to, floorId } = await searchParams;

  const [report, floors] = await Promise.all([
    reportService.tenants({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      floorId: floorId || undefined,
    }),
    roomService.listFloors(),
  ]);

  const net = report.newThisPeriod - report.endedThisPeriod;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Typography variant="h2" className="mb-1">
          Laporan Penyewa
        </Typography>
        <Typography variant="muted">Kontrak aktif, keluar, baru, terlambat bayar, dan blacklist.</Typography>
      </div>

      <ReportFilterBar floors={floors} from={from} to={to} floorId={floorId} />

      <section className="border-y border-border py-8">
        <MetricBlock
          label="Kontrak Aktif"
          value={formatNumber(report.active)}
          size="hero"
          meta={
            net === 0
              ? 'Jumlah penghuni tetap pada periode ini'
              : `${net > 0 ? '+' : '−'}${formatNumber(Math.abs(net))} penghuni pada periode ini`
          }
        />
      </section>

      <MetricRow columns={4} stacked>
        <MetricBlock label="Baru Periode Ini" value={formatNumber(report.newThisPeriod)} />
        <MetricBlock label="Keluar Periode Ini" value={formatNumber(report.endedThisPeriod)} />
        <MetricBlock
          label="Terlambat Bayar"
          value={formatNumber(report.overdueCount)}
          tone={report.overdueCount > 0 ? 'destructive' : 'muted'}
        />
        <MetricBlock
          label="Blacklist"
          value={formatNumber(report.blacklisted)}
          href="/admin/tenants/blacklist"
          tone={report.blacklisted > 0 ? 'destructive' : 'muted'}
        />
      </MetricRow>
    </div>
  );
}
