import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { facilityService } from '@/services/facility.service';

import { FacilityCard } from './FacilityCard';
import { FacilityFormDialog } from './FacilityFormDialog';

const GROUPS = [
  { category: 'COMMON', label: 'Fasilitas Umum' },
  { category: 'ROOM', label: 'Fasilitas Kamar' },
] as const;

export default async function FacilitiesPage() {
  const facilities = await facilityService.listWithUsage();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Typography variant="h2" className="mb-1">
            Fasilitas
          </Typography>
          <Typography variant="muted">
            Master daftar fasilitas yang bisa dipasang ke kamar.
          </Typography>
        </div>
        <FacilityFormDialog
          mode="create"
          renderTrigger={(open) => (
            <Button type="button" onClick={open}>
              Tambah Fasilitas
            </Button>
          )}
        />
      </div>

      {facilities.length === 0 ? (
        <Typography variant="muted">Belum ada fasilitas.</Typography>
      ) : (
        GROUPS.map(({ category, label }) => {
          const items = facilities.filter((facility) => facility.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <Typography variant="h4" className="mb-3">
                {label}
              </Typography>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((facility) => (
                  <FacilityCard
                    key={facility.id}
                    id={facility.id}
                    name={facility.name}
                    icon={facility.icon}
                    category={facility.category}
                    usageCount={facility._count.rooms + facility._count.roomTypes}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
