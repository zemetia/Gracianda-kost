import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Penyewa</TableHead>
            <TableHead>Kamar</TableHead>
            <TableHead>Mulai</TableHead>
            <TableHead>Berakhir</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium text-foreground">
                <Link href={`/admin/contracts/${contract.id}`} className="hover:underline">
                  {contract.contractCode}
                </Link>
              </TableCell>
              <TableCell className="text-foreground-muted">{contract.tenant.fullName}</TableCell>
              <TableCell className="text-foreground-muted">
                {contract.room.property.name} — No. {contract.room.number} {contract.room.floor ? `(${contract.room.floor.name})` : ''}
              </TableCell>
              <TableCell className="tabular-nums text-foreground-muted">
                {formatDate(contract.startDate, 'id-ID')}
              </TableCell>
              <TableCell className="tabular-nums text-foreground-muted">
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
              </TableCell>
              <TableCell>
                <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'outline'}>
                  {STATUS_LABEL[contract.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
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
              </TableCell>
            </TableRow>
          ))}
          {contracts.length === 0 && (
            <TableEmpty colSpan={7}>
              {endingDays ? 'Tidak ada kontrak yang segera berakhir.' : 'Belum ada kontrak.'}
            </TableEmpty>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
