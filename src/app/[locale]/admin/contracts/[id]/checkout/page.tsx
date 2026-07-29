import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
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
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Check-out Penyewa
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
          <CardTitle>Penyelesaian Akhir</CardTitle>
          <CardDescription>
            Tunggakan, deposit, dan kondisi kamar diselesaikan di satu layar — supaya tidak ada
            uang jaminan yang hilang jejaknya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CheckoutForm
            contractId={contract.id}
            deposit={contract.deposit?.toNumber() ?? 0}
            outstanding={outstanding}
          />
        </CardContent>
      </Card>
    </div>
  );
}
