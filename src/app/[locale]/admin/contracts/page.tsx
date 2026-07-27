import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/auth';
import { contractService } from '@/services/contract.service';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  ENDED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export default async function ContractsPage() {
  const [contracts, session] = await Promise.all([contractService.list(), getSession()]);
  const canCreate = session && ['SUPER_ADMIN', 'OPERASIONAL'].includes(session.user.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2" className="mb-1">
            Kontrak
          </Typography>
          <Typography variant="muted">Riwayat seluruh kontrak sewa.</Typography>
        </div>
        {canCreate && (
          <Link href="/admin/contracts/new">
            <Button>Kontrak Baru</Button>
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-foreground-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Kode</th>
              <th className="px-4 py-3 font-medium">Penyewa</th>
              <th className="px-4 py-3 font-medium">Kamar</th>
              <th className="px-4 py-3 font-medium">Mulai</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contracts.map((contract) => (
              <tr key={contract.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link href={`/admin/contracts/${contract.id}`} className="hover:underline">
                    {contract.contractCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground-muted">{contract.tenant.fullName}</td>
                <td className="px-4 py-3 text-foreground-muted">
                  {contract.room.property.name} — No. {contract.room.number} {contract.room.floor ? `(${contract.room.floor.name})` : ''}
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {contract.startDate.toLocaleDateString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={contract.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {STATUS_LABEL[contract.status]}
                  </Badge>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground-subtle">
                  Belum ada kontrak.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
