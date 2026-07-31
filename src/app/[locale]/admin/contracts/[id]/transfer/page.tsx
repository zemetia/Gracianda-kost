import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/ui/PageHeader';
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
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Pindah Kamar"
        description={`${contract.tenant.fullName} · dari ${contract.room.property.name} Unit ${contract.room.number} · ${contract.contractCode} — kontrak lama ditutup pada tanggal pindah dan kamar lama langsung kembali tersedia, keduanya dalam satu transaksi.`}
        backHref={`/admin/contracts/${contract.id}`}
        backLabel="Detail Kontrak"
      />

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
    </div>
  );
}
