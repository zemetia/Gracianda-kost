import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Kontrak Sewa Baru</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
