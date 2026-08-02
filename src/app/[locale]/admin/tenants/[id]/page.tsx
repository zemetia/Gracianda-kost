import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricInline } from '@/components/ui/Metric';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import {
  INCIDENT_STATUS_VARIANT,
  incidentCategoryLabel,
  incidentPersonRoleLabel,
  incidentPlaceLabel,
  incidentStatusLabel,
} from '@/lib/incident';
import { canAccess } from '@/lib/auth';
import { blacklistReasonLabel, blacklistReasonTone } from '@/lib/blacklist';
import { genderLabel, maritalStatusLabel, occupantCountLabel } from '@/lib/tenant';
import { formatDate } from '@/lib/utils';
import { tenantService } from '@/services/tenant.service';
import { attachmentService } from '@/services/attachment.service';
import { incidentService } from '@/services/incident.service';

import { BlacklistPanel } from './BlacklistPanel';
import { KtpUpload } from './KtpUpload';

interface Props {
  params: Promise<{ id: string }>;
}

const CONTRACT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  ENDED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params;
  const [tenant, ktpDocs, incidents, canManage] = await Promise.all([
    tenantService.getById(id),
    attachmentService.listFor('TENANT', id),
    incidentService.listForTenant(id),
    canAccess(['SUPER_ADMIN', 'OPERASIONAL']),
  ]);

  if (!tenant) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            {tenant.fullName}
          </Typography>
          <Typography variant="muted">
            {tenant.ktpNumber} · {tenant.phone}
            {tenant.email ? ` · ${tenant.email}` : ''}
          </Typography>
        </div>
        {tenant.isBlacklisted && (
          <Badge variant={blacklistReasonTone(tenant.blacklistReason)}>
            Blacklist · {blacklistReasonLabel(tenant.blacklistReason)}
          </Badge>
        )}
      </div>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Data Penyewa
        </h3>
        <div className="mt-3">
          <MetricInline label="Jenis kelamin" value={genderLabel(tenant.gender)} />
          <MetricInline
            label="Tempat, tanggal lahir"
            value={
              [tenant.birthPlace, tenant.birthDate ? formatDate(tenant.birthDate, 'id-ID') : '']
                .filter(Boolean)
                .join(', ') || '—'
            }
          />
          <MetricInline label="Status pernikahan" value={maritalStatusLabel(tenant.maritalStatus)} />
          <MetricInline label="Pekerjaan" value={tenant.occupation ?? '—'} />
          <MetricInline label="Kantor / kampus" value={tenant.institution ?? '—'} />
          <MetricInline
            label="Kendaraan"
            value={
              tenant.vehicleType
                ? `${tenant.vehicleType}${tenant.vehiclePlate ? ` (${tenant.vehiclePlate})` : ''}`
                : '—'
            }
          />
          <MetricInline label="Alamat asal (KTP)" value={tenant.idAddress ?? '—'} />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Kontak Darurat
        </h3>
        <div className="mt-3">
          <MetricInline
            label="Nama"
            value={
              tenant.emergencyName
                ? `${tenant.emergencyName}${tenant.emergencyRelation ? ` (${tenant.emergencyRelation})` : ''}`
                : '—'
            }
          />
          <MetricInline label="Nomor HP" value={tenant.emergencyPhone ?? '—'} />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Scan KTP</CardTitle>
        </CardHeader>
        <CardContent>
          <KtpUpload tenantId={id} attachments={ktpDocs} />
        </CardContent>
      </Card>

      {/* Read before deciding on a blacklist or a renewal — that is why it sits
          above the blacklist card, not at the bottom of the page. */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>Riwayat Insiden</CardTitle>
          {incidents.length > 0 && (
            <Link
              href={`/admin/incidents?tenantId=${id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Filter di daftar insiden
            </Link>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/admin/incidents/${incident.id}`}
              className="flex items-center justify-between gap-4 rounded-md border border-border p-3 hover:bg-surface-raised"
            >
              <div>
                <Typography variant="large" as="span">
                  {incidentCategoryLabel(incident.category)}
                </Typography>
                <Typography variant="muted">
                  {formatDate(incident.date, 'id-ID')} · {incident.property.name} ·{' '}
                  {incidentPlaceLabel(incident)}
                  {incident.people[0]
                    ? ` · sebagai ${incidentPersonRoleLabel(incident.people[0].role).toLowerCase()}`
                    : ''}
                </Typography>
              </div>
              <Badge variant={INCIDENT_STATUS_VARIANT[incident.status]}>
                {incidentStatusLabel(incident.status)}
              </Badge>
            </Link>
          ))}
          {incidents.length === 0 && (
            <Typography variant="muted">Belum pernah tercatat dalam insiden.</Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blacklist</CardTitle>
        </CardHeader>
        <CardContent>
          <BlacklistPanel
            tenantId={id}
            fullName={tenant.fullName}
            isBlacklisted={tenant.isBlacklisted}
            reason={tenant.blacklistReason}
            note={tenant.blacklistNote}
            blacklistedAt={tenant.blacklistedAt?.toISOString() ?? null}
            blacklistedByName={tenant.blacklistedBy?.name ?? tenant.blacklistedBy?.email ?? null}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kontrak</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tenant.contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/admin/contracts/${contract.id}`}
              className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-surface-raised"
            >
              <div>
                <Typography variant="large" as="span">
                  {contract.contractCode}
                </Typography>
                <Typography variant="muted">
                  Kamar {contract.room.number} · {formatDate(contract.startDate, 'id-ID')}
                  {contract.actualEndDate ? ` – ${formatDate(contract.actualEndDate, 'id-ID')}` : ''}
                  {` · ${occupantCountLabel(contract.occupants.length)}`}
                </Typography>
              </div>
              <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'outline'}>
                {CONTRACT_STATUS_LABEL[contract.status]}
              </Badge>
            </Link>
          ))}
          {tenant.contracts.length === 0 && (
            <Typography variant="muted">Belum ada kontrak.</Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
