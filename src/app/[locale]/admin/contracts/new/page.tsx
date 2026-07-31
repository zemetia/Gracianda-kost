import { PageHeader } from '@/components/ui/PageHeader';
import { getPropertyScope } from '@/lib/property-scope';
import { roomService } from '@/services/room.service';
import { tenantService } from '@/services/tenant.service';

import { NewContractForm } from '../NewContractForm';

interface Props {
  searchParams: Promise<{ propertyId?: string; roomId?: string }>;
}

export default async function NewContractPage({ searchParams }: Props) {
  const { propertyId, roomId } = await searchParams;
  const scopedPropertyId = await getPropertyScope(propertyId);

  const [tenants, rooms] = await Promise.all([
    tenantService.list(),
    roomService.listAvailable(scopedPropertyId),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        title="Kontrak Sewa Baru"
        description="Tiga langkah: pilih penyewa, tentukan kamar & tarif, lalu konfirmasi."
        backHref="/admin/contracts"
        backLabel="Daftar Kontrak"
      />

      <NewContractForm
        preselectedRoomId={roomId}
        tenants={tenants.map((t) => ({
          id: t.id,
          fullName: t.fullName,
          ktpNumber: t.ktpNumber,
          phone: t.phone,
          isBlacklisted: t.isBlacklisted,
          blacklistNote: t.blacklistNote,
        }))}
        rooms={rooms.map((r) => ({
          id: r.id,
          number: r.number,
          price: r.price.toNumber(),
          floor: r.floor ? { name: r.floor.name } : null,
          property: { name: r.property.name },
          prices: r.prices.map((p) => ({
            id: p.id,
            billingCycle: p.billingCycle,
            interval: p.interval,
            price: p.price.toNumber(),
          })),
        }))}
      />
    </div>
  );
}
