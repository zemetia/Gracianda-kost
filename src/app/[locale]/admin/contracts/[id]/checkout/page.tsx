import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/PageHeader';
import { contractService } from '@/services/contract.service';
import { paymentService } from '@/services/payment.service';

import { CheckoutForm } from '../CheckoutForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CheckoutContractPage({ params }: Props) {
  const { id } = await params;
  const contract = await contractService.getById(id);
  if (!contract || contract.status !== 'ACTIVE') notFound();

  const outstanding = await paymentService.getOutstandingByContract(id);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Check-out Penyewa"
        description={`${contract.tenant.fullName} · ${contract.room.property.name} Unit ${contract.room.number} · ${contract.contractCode} — tunggakan, deposit, dan kondisi kamar diselesaikan di satu layar.`}
        backHref={`/admin/contracts/${contract.id}`}
        backLabel="Detail Kontrak"
      />

      <CheckoutForm
        contractId={contract.id}
        deposit={contract.deposit?.toNumber() ?? 0}
        outstanding={outstanding}
      />
    </div>
  );
}
