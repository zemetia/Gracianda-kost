import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { contractService } from '@/services/contract.service';

import { renewContractAction } from '../../actions';
import { ContractTermForm } from '../ContractTermForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RenewContractPage({ params }: Props) {
  const { id } = await params;
  const contract = await contractService.getById(id);
  if (!contract || contract.status !== 'ACTIVE') notFound();

  const today = new Date().toISOString().split('T')[0] || '';
  const startDate = (contract.endDate ?? new Date()).toISOString().split('T')[0] || today;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Perpanjang Kontrak
        </Typography>
        <Typography variant="muted">
          {contract.tenant.fullName} · {contract.room.property.name} Unit {contract.room.number} ·{' '}
          <Link href={`/admin/contracts/${contract.id}`} className="hover:underline">
            {contract.contractCode}
          </Link>
        </Typography>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Masa Sewa Berikutnya</CardTitle>
          <CardDescription>
            Kamar dan penghuni tambahan dibawa otomatis. Kontrak lama ditutup dan terhubung ke
            kontrak baru ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractTermForm
            action={renewContractAction.bind(null, contract.id)}
            submitLabel="Perpanjang Kontrak"
            defaults={{
              rentPrice: contract.rentPrice.toNumber(),
              deposit: contract.deposit?.toNumber() ?? null,
              billingCycle: contract.billingCycle,
              billingInterval: contract.billingInterval,
              startDate,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
