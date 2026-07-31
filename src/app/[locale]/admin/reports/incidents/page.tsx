import { MetricBlock, MetricInline } from '@/components/ui/Metric';
import { Typography } from '@/components/ui/Typography';
import { canAccess } from '@/lib/auth';
import { formatNumber, formatPercent } from '@/lib/utils';
import { reportService } from '@/services/report.service';
import { roomService } from '@/services/room.service';

import { Forbidden } from '../../Forbidden';
import { ReportFilterBar } from '../ReportFilterBar';

interface Props {
  searchParams: Promise<{ from?: string; to?: string; floorId?: string }>;
}

const CATEGORY_LABEL: Record<string, string> = {
  PELANGGARAN_ATURAN: 'Pelanggaran Aturan',
  GANGGUAN: 'Gangguan',
  KERUSAKAN: 'Kerusakan',
  KEHILANGAN: 'Kehilangan',
  KELUHAN_PENGHUNI: 'Keluhan Penghuni',
  LAPORAN_SECURITY: 'Laporan Security',
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Diproses',
  RESOLVED: 'Selesai',
};

export default async function IncidentsReportPage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'SECURITY']))) return <Forbidden />;
  const { from, to, floorId } = await searchParams;

  const [report, floors] = await Promise.all([
    reportService.incidents({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      floorId: floorId || undefined,
    }),
    roomService.listFloors(),
  ]);

  const share = (count: number) => (report.total > 0 ? formatPercent((count / report.total) * 100) : '—');

  const statuses = Object.entries(report.byStatus);
  const categories = Object.entries(report.byCategory).sort(([, a], [, b]) => b - a);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Typography variant="h2" className="mb-1">
          Laporan Insiden
        </Typography>
        <Typography variant="muted">Breakdown insiden per status dan kategori.</Typography>
      </div>

      <ReportFilterBar floors={floors} from={from} to={to} floorId={floorId} />

      <section className="border-y border-border py-8">
        <MetricBlock
          label="Total Insiden"
          value={formatNumber(report.total)}
          size="hero"
          tone={report.total > 0 ? 'default' : 'muted'}
          meta={report.total === 0 ? 'Tidak ada insiden pada periode ini' : undefined}
        />
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Per Status
          </h3>
          <div className="mt-4">
            {statuses.map(([status, count]) => (
              <MetricInline
                key={status}
                label={STATUS_LABEL[status] ?? status}
                value={formatNumber(count)}
                trailing={<span className="text-xs tabular-nums text-foreground-muted">{share(count)}</span>}
              />
            ))}
            {statuses.length === 0 && (
              <p className="text-sm text-foreground-muted">Tidak ada data untuk periode ini.</p>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Per Kategori
          </h3>
          <div className="mt-4">
            {categories.map(([category, count]) => (
              <MetricInline
                key={category}
                label={CATEGORY_LABEL[category] ?? category}
                value={formatNumber(count)}
                trailing={<span className="text-xs tabular-nums text-foreground-muted">{share(count)}</span>}
              />
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-foreground-muted">Tidak ada data untuk periode ini.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
