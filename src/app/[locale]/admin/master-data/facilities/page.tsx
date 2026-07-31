import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Typography } from '@/components/ui/Typography';
import { facilityService } from '@/services/facility.service';

import { removeFacilityAction } from './actions';
import { NewFacilityForm } from './NewFacilityForm';

const GROUPS = [
  { category: 'COMMON', label: 'Fasilitas Umum' },
  { category: 'ROOM', label: 'Fasilitas Kamar' },
] as const;

export default async function FacilitiesPage() {
  const facilities = await facilityService.list();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Typography variant="h2" className="mb-1">
          Fasilitas
        </Typography>
        <Typography variant="muted">Master daftar fasilitas yang bisa dipasang ke kamar.</Typography>
      </div>

      <Card>
        <CardContent>
          <NewFacilityForm />
        </CardContent>
      </Card>

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
              <div className="flex flex-wrap gap-2">
                {items.map((facility) => (
                  <form key={facility.id} action={removeFacilityAction.bind(null, facility.id)}>
                    <button type="submit" title="Klik untuk hapus">
                      <Badge variant="outline" className="cursor-pointer hover:border-destructive hover:text-destructive">
                        {facility.name} ×
                      </Badge>
                    </button>
                  </form>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
