import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from '@/i18n/navigation';
import { parseRecordStatus } from '@/lib/record-status';
import { formatPropertyAddress } from '@/lib/utils';
import { propertyService } from '@/services/property.service';

import { StatusFilter } from '../StatusFilter';
import { PropertyCard } from './PropertyCard';

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const selectedStatus = parseRecordStatus(status);

  const [properties, statusCounts] = await Promise.all([
    propertyService.list(selectedStatus),
    propertyService.counts(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Properti"
        description="Kelola data gedung kost, rumah sewa, apartemen, atau villa — termasuk lokasi, kontak penanggung jawab, dan aturan penghuni."
        action={
          <Link href="/admin/master-data/properties/new">
            <Button>Tambah Properti</Button>
          </Link>
        }
      />

      <StatusFilter
        status={selectedStatus}
        counts={statusCounts}
        basePath="/admin/master-data/properties"
      />

      {properties.length === 0 ? (
        selectedStatus === 'inactive' ? (
          <p className="text-foreground-muted py-12 text-center text-sm">
            Tidak ada properti yang dinonaktifkan.
          </p>
        ) : (
          <div className="border-border flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="text-foreground text-sm font-medium">Belum ada properti</p>
            <p className="text-foreground-muted max-w-sm text-sm">
              Tambahkan properti pertama untuk mulai mendata lantai, kamar, dan kontrak penyewa.
            </p>
            <Link href="/admin/master-data/properties/new" className="mt-1">
              <Button size="sm">Tambah Properti</Button>
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              id={prop.id}
              name={prop.name}
              code={prop.code}
              type={prop.type}
              genderPolicy={prop.genderPolicy}
              address={formatPropertyAddress(prop)}
              mapsUrl={prop.mapsUrl}
              contactName={prop.contactName}
              contactPhone={prop.contactPhone}
              whatsappNumber={prop.whatsappNumber}
              curfewTime={prop.curfewTime}
              roomCount={prop._count.rooms}
              isActive={prop.isActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
