import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { contractService } from '@/services/contract.service';
import { roomService } from '@/services/room.service';

import { transferRoomAction } from '../../actions';
import { ContractTermForm } from '../ContractTermForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TransferRoomPage({ params }: Props) {
  const { id } = await params;
  const contract = await contractService.getById(id);
  if (!contract || contract.status !== 'ACTIVE') notFound();

  const availableRooms = await roomService.listAvailable();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Pindah Kamar
        </Typography>
        <Typography variant="muted">
          {contract.tenant.fullName} · dari {contract.room.property.name} Unit{' '}
          {contract.room.number} ·{' '}
          <Link href={`/admin/contracts/${contract.id}`} className="hover:underline">
            {contract.contractCode}
          </Link>
        </Typography>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kamar & Masa Sewa Baru</CardTitle>
          <CardDescription>
            Kontrak lama ditutup pada tanggal pindah dan kamar lama langsung kembali tersedia —
            keduanya dalam satu transaksi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractTermForm
            action={transferRoomAction.bind(null, contract.id)}
            submitLabel="Pindahkan Penyewa"
            rooms={availableRooms.map((room) => ({
              id: room.id,
              number: room.number,
              propertyName: room.property.name,
              floorName: room.floor?.name ?? null,
              price: room.price.toNumber(),
            }))}
            defaults={{
              rentPrice: contract.rentPrice.toNumber(),
              deposit: contract.deposit?.toNumber() ?? null,
              billingCycle: contract.billingCycle,
              billingInterval: contract.billingInterval,
              startDate: new Date().toISOString().split('T')[0] || '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
