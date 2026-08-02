import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { canAccess } from '@/lib/auth';
import { tenantService } from '@/services/tenant.service';

import { AddToBlacklistButton } from './AddToBlacklistButton';
import { BlacklistCard } from './BlacklistCard';
import { ReasonFilter } from './ReasonFilter';

interface Props {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}

const CAN_MANAGE = ['SUPER_ADMIN', 'OPERASIONAL'];

export default async function BlacklistPage({ searchParams }: Props) {
  const { q, kategori } = await searchParams;
  const query = q ?? '';
  const reason = kategori ?? '';

  const canManage = await canAccess(CAN_MANAGE);

  const [entries, reasonCounts, candidates] = await Promise.all([
    tenantService.listBlacklisted({ query, reason }),
    tenantService.blacklistReasonCounts(),
    canManage ? tenantService.listBlacklistCandidates() : Promise.resolve([]),
  ]);

  const isFiltered = Boolean(query || reason);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blacklist Penyewa"
        description="Orang-orang yang sebaiknya tidak menyewa lagi, beserta alasannya. Daftar ini tidak memblokir kontrak — ia memunculkan peringatan yang harus dikonfirmasi admin saat namanya dipilih."
        action={canManage ? <AddToBlacklistButton candidates={candidates} /> : undefined}
      />

      <Card noPadding>
        <CardContent className="p-4">
          <form method="get" className="max-w-sm">
            {/* Kategori ikut dibawa supaya mencari tidak diam-diam mengembalikan
                filter ke "Semua". */}
            {reason && <input type="hidden" name="kategori" value={reason} />}
            <Input
              label="Cari"
              name="q"
              size="sm"
              defaultValue={query}
              placeholder="Nama, KTP, atau nomor HP"
            />
          </form>
        </CardContent>
      </Card>

      <ReasonFilter
        reason={reason}
        counts={reasonCounts.counts}
        total={reasonCounts.total}
        query={query}
      />

      {entries.length === 0 ? (
        <p className="text-foreground-muted py-12 text-center text-sm">
          {isFiltered
            ? 'Tidak ada penyewa yang cocok dengan filter ini.'
            : 'Belum ada penyewa di daftar hitam. Semoga tetap begitu.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {entries.map((tenant) => (
            <BlacklistCard
              key={tenant.id}
              canManage={canManage}
              entry={{
                id: tenant.id,
                fullName: tenant.fullName,
                ktpNumber: tenant.ktpNumber,
                phone: tenant.phone,
                reason: tenant.blacklistReason,
                note: tenant.blacklistNote,
                blacklistedAt: tenant.blacklistedAt?.toISOString() ?? null,
                blacklistedByName:
                  tenant.blacklistedBy?.name ?? tenant.blacklistedBy?.email ?? null,
                activeContracts: tenant.contracts.map((contract) => ({
                  id: contract.id,
                  contractCode: contract.contractCode,
                  roomNumber: contract.room.number,
                  propertyName: contract.room.property.name,
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
