import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { formatDate } from '@/lib/utils';
import { contractService } from '@/services/contract.service';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  ENDED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

interface Props {
  searchParams: Promise<{ ending?: string; propertyId?: string }>;
}

function daysUntil(date: Date): number {
  const today = new Date();
  const diff = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
    new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round(diff / 86_400_000);
}

export default async function ContractsPage({ searchParams }: Props) {
  const { ending, propertyId } = await searchParams;
  const endingDays = ending ? Number(ending) : undefined;
  const scopedPropertyId = await getPropertyScope(propertyId);

  const [contracts, session] = await Promise.all([
    endingDays
      ? contractService.listEndingSoon(endingDays, scopedPropertyId)
      : contractService.list(scopedPropertyId),
    getSession(),
  ]);
  const canCreate = session && ['SUPER_ADMIN', 'OPERASIONAL'].includes(session.user.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Kontrak
          </Typography>
          <Typography variant="muted">
            {endingDays
              ? `Kontrak yang berakhir dalam ${endingDays} hari ke depan.`
              : 'Riwayat seluruh kontrak sewa.'}
          </Typography>
        </div>
        {canCreate && (
          <Link href="/admin/contracts/new">
            <Button>Kontrak Baru</Button>
          </Link>
        )}
      </div>

      {endingDays && (
        <Link href="/admin/contracts" className="self-start text-sm text-primary hover:underline">
          ← Tampilkan semua kontrak
        </Link>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left [&>th]:py-2 [&>th]:pr-4 [&>th]:text-xs [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-foreground-muted">
              <th>Kode</th>
              <th>Penyewa</th>
              <th>Kamar</th>
              <th>Mulai</th>
              <th>Berakhir</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.id} className="border-b border-border [&>td]:py-2.5 [&>td]:pr-4">
                <td className="font-medium text-foreground">
                  <Link href={`/admin/contracts/${contract.id}`} className="hover:underline">
                    {contract.contractCode}
                  </Link>
                </td>
                <td className="text-foreground-muted">{contract.tenant.fullName}</td>
                <td className="text-foreground-muted">
                  {contract.room.property.name} — No. {contract.room.number} {contract.room.floor ? `(${contract.room.floor.name})` : ''}
                </td>
                <td className="tabular-nums text-foreground-muted">
                  {formatDate(contract.startDate, 'id-ID')}
                </td>
                <td className="tabular-nums text-foreground-muted">
                  {contract.endDate ? (
                    <span className="flex flex-col">
                      {formatDate(contract.endDate, 'id-ID')}
                      {contract.status === 'ACTIVE' && daysUntil(contract.endDate) <= 30 && (
                        <span className="text-xs font-medium text-foreground">
                          {daysUntil(contract.endDate)} hari lagi
                        </span>
                      )}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {STATUS_LABEL[contract.status]}
                  </Badge>
                </td>
                <td className="pr-0 text-right">
                  {contract.status === 'ACTIVE' && canCreate && (
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/contracts/${contract.id}/renew`}>
                        <Button variant="ghost" size="xs">
                          Perpanjang
                        </Button>
                      </Link>
                      <Link href={`/admin/contracts/${contract.id}/checkout`}>
                        <Button variant="ghost" size="xs">
                          Check-out
                        </Button>
                      </Link>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-foreground-muted">
                  {endingDays ? 'Tidak ada kontrak yang segera berakhir.' : 'Belum ada kontrak.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
