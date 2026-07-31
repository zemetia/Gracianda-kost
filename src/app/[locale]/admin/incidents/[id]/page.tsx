import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Typography } from '@/components/ui/Typography';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { incidentService } from '@/services/incident.service';

import { IncidentStatusForm } from './IncidentStatusForm';

interface Props {
  params: Promise<{ id: string }>;
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

const STATUS_VARIANT: Record<string, 'destructive' | 'warning' | 'success'> = {
  OPEN: 'destructive',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

export default async function IncidentDetailPage({ params }: Props) {
  const { id } = await params;
  const [incident, session] = await Promise.all([incidentService.getById(id), getSession()]);
  if (!incident) notFound();

  const canManage = session && ['SUPER_ADMIN', 'SECURITY'].includes(session.user.role);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            {CATEGORY_LABEL[incident.category]}
          </Typography>
          <Typography variant="muted">
            {formatDate(incident.date, 'id-ID')} ·{' '}
            {incident.property.name} · {incident.room ? `Unit ${incident.room.number} ${incident.room.floor ? `(${incident.room.floor.name})` : ''}` : incident.location ?? 'Seluruh Properti'}
          </Typography>
        </div>
        <Badge variant={STATUS_VARIANT[incident.status]}>{STATUS_LABEL[incident.status]}</Badge>
      </div>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Deskripsi
        </h3>
        <Typography variant="p" className="mt-3 whitespace-pre-line">
          {incident.description}
        </Typography>
      </section>

      {canManage && (
        <section className="border-t border-border pt-6">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Ubah Status
          </h3>
          <IncidentStatusForm incidentId={incident.id} currentStatus={incident.status} />
        </section>
      )}
    </div>
  );
}
