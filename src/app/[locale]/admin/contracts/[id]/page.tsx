import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { contractService } from '@/services/contract.service';

import { CloseContractForm } from './CloseContractForm';

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  ENDED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params;
  const contract = await contractService.getById(id);
  if (!contract) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            {contract.contractCode}
          </Typography>
          <Typography variant="muted">
            <Link href={`/admin/tenants/${contract.tenantId}`} className="hover:underline">
              {contract.tenant.fullName}
            </Link>{' '}
            · Kamar {contract.room.number} ({contract.room.floor.name})
          </Typography>
        </div>
        <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'outline'}>
          {STATUS_LABEL[contract.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Kontrak</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Typography variant="muted">Harga Sewa</Typography>
            <Typography variant="p">Rp {contract.rentPrice.toNumber().toLocaleString('id-ID')}</Typography>
          </div>
          <div>
            <Typography variant="muted">Deposit</Typography>
            <Typography variant="p">
              {contract.deposit ? `Rp ${contract.deposit.toNumber().toLocaleString('id-ID')}` : '—'}
            </Typography>
          </div>
          <div>
            <Typography variant="muted">Tanggal Masuk</Typography>
            <Typography variant="p">{contract.startDate.toLocaleDateString('id-ID')}</Typography>
          </div>
          <div>
            <Typography variant="muted">Tanggal Keluar</Typography>
            <Typography variant="p">
              {contract.actualEndDate ? contract.actualEndDate.toLocaleDateString('id-ID') : '—'}
            </Typography>
          </div>
          {contract.notes && (
            <div className="col-span-2">
              <Typography variant="muted">Catatan</Typography>
              <Typography variant="p">{contract.notes}</Typography>
            </div>
          )}
        </CardContent>
      </Card>

      {contract.occupants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Penghuni Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {contract.occupants.map((occupant) => (
              <Badge key={occupant.id} variant="outline">
                {occupant.fullName}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {contract.status === 'ACTIVE' && (
        <Card>
          <CardHeader>
            <CardTitle>Tutup Kontrak</CardTitle>
          </CardHeader>
          <CardContent>
            <CloseContractForm contractId={contract.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
