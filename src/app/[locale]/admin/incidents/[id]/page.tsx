import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import {
  INCIDENT_STATUS_VARIANT,
  incidentCategoryLabel,
  incidentPersonRoleLabel,
  incidentPlaceLabel,
  incidentStatusLabel,
} from '@/lib/incident';
import { formatDate } from '@/lib/utils';
import { incidentService } from '@/services/incident.service';

import { IncidentStatusForm } from './IncidentStatusForm';

interface Props {
  params: Promise<{ id: string }>;
}

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
            {incidentCategoryLabel(incident.category)}
          </Typography>
          <Typography variant="muted">
            {formatDate(incident.date, 'id-ID')} · {incident.property.name} ·{' '}
            {incidentPlaceLabel(incident)}
          </Typography>
        </div>
        <Badge variant={INCIDENT_STATUS_VARIANT[incident.status]}>
          {incidentStatusLabel(incident.status)}
        </Badge>
      </div>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Deskripsi
        </h3>
        <Typography variant="p" className="mt-3 whitespace-pre-line">
          {incident.description}
        </Typography>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Orang Terkait
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          {incident.people.map((person) => (
            <div
              key={person.id}
              className="flex items-start justify-between gap-4 rounded-md border border-border p-3"
            >
              <div>
                <Typography variant="large" as="span">
                  {person.tenantId ? (
                    <Link href={`/admin/tenants/${person.tenantId}`} className="hover:underline">
                      {person.name}
                    </Link>
                  ) : (
                    person.name
                  )}
                </Typography>
                <Typography variant="muted">
                  {[person.phone, person.notes].filter(Boolean).join(' · ') ||
                    (person.tenantId || person.occupantId ? 'Penghuni terdaftar' : 'Bukan penghuni')}
                </Typography>
              </div>
              <Badge variant="outline">{incidentPersonRoleLabel(person.role)}</Badge>
            </div>
          ))}
          {incident.people.length === 0 && (
            <Typography variant="muted">Tidak ada orang yang dicatat pada laporan ini.</Typography>
          )}
        </div>
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
