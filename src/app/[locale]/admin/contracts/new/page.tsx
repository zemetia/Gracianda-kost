import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { roomService } from '@/services/room.service';
import { tenantService } from '@/services/tenant.service';

import { NewContractForm } from '../NewContractForm';

export default async function NewContractPage() {
  const [tenants, rooms] = await Promise.all([tenantService.list(), roomService.listAvailable()]);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Kontrak Sewa Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <NewContractForm
            tenants={tenants.map((t) => ({ id: t.id, fullName: t.fullName, ktpNumber: t.ktpNumber }))}
            rooms={rooms.map((r) => ({
              id: r.id,
              number: r.number,
              price: r.price.toNumber(),
              floor: { name: r.floor.name },
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
