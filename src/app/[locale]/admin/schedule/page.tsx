import { Typography } from '@/components/ui/Typography';
import { canAccess } from '@/lib/auth';
import { getPropertyScope } from '@/lib/property-scope';
import { dashboardService } from '@/services/dashboard.service';

import { Forbidden } from '../Forbidden';
import { ScheduleCalendarView } from './ScheduleCalendarView';

interface Props {
  searchParams: Promise<{
    month?: string;
    year?: string;
    propertyId?: string;
  }>;
}

export default async function SchedulePage({ searchParams }: Props) {
  if (!(await canAccess(['SUPER_ADMIN', 'OPERASIONAL', 'KEUANGAN']))) {
    return <Forbidden />;
  }

  const { month, year, propertyId } = await searchParams;
  const selectedPropertyId = await getPropertyScope(propertyId);

  const now = new Date();
  const targetMonth = month ? Number(month) : now.getMonth() + 1;
  const targetYear = year ? Number(year) : now.getFullYear();

  const schedule = await dashboardService.getOperationalSchedule(
    selectedPropertyId,
    targetMonth,
    targetYear,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h2" className="mb-1">
          Jadwal &amp; Timeline Operasional
        </Typography>
        <Typography variant="muted">
          Kalender terpadu jatuh tempo sewa, perawatan rutin berkala, dan serah terima kunci kamar.
        </Typography>
      </div>

      <ScheduleCalendarView
        month={schedule.month}
        year={schedule.year}
        events={schedule.events}
        propertyId={selectedPropertyId}
      />
    </div>
  );
}
