import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { tenantService } from '@/services/tenant.service';
import { attachmentService } from '@/services/attachment.service';

import { BlacklistForm } from './BlacklistForm';
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
  const [tenant, ktpDocs] = await Promise.all([
    tenantService.getById(id),
    attachmentService.listFor('TENANT', id),
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
        {tenant.isBlacklisted && <Badge variant="destructive">Blacklist</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Penyewa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Typography variant="muted">Pekerjaan</Typography>
            <Typography variant="p">{tenant.occupation ?? '—'}</Typography>
          </div>
          <div>
            <Typography variant="muted">Kendaraan</Typography>
            <Typography variant="p">
              {tenant.vehicleType ?? '—'} {tenant.vehiclePlate ? `(${tenant.vehiclePlate})` : ''}
            </Typography>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan KTP</CardTitle>
        </CardHeader>
        <CardContent>
          <KtpUpload tenantId={id} attachments={ktpDocs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blacklist</CardTitle>
        </CardHeader>
        <CardContent>
          <BlacklistForm
            tenantId={id}
            isBlacklisted={tenant.isBlacklisted}
            blacklistNote={tenant.blacklistNote}
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
                  Kamar {contract.room.number} · {contract.startDate.toLocaleDateString('id-ID')}
                  {contract.actualEndDate ? ` – ${contract.actualEndDate.toLocaleDateString('id-ID')}` : ''}
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
