import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/PageHeader';
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
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Perpanjang Kontrak"
        description={`${contract.tenant.fullName} · ${contract.room.property.name} Unit ${contract.room.number} · ${contract.contractCode} — kamar dan penghuni tambahan dibawa otomatis, kontrak lama ditutup dan terhubung ke kontrak baru ini.`}
        backHref={`/admin/contracts/${contract.id}`}
        backLabel="Detail Kontrak"
      />

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
    </div>
  );
}
