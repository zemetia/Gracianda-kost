'use client';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

import { updateIncidentStatusAction } from '../actions';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
];

export function IncidentStatusForm({ incidentId, currentStatus }: { incidentId: string; currentStatus: string }) {
  return (
    <form action={updateIncidentStatusAction.bind(null, incidentId)} className="flex items-end gap-3">
      <Select
        name="status"
        label="Status"
        defaultValue={currentStatus}
        options={STATUS_OPTIONS}
        className="sm:w-56"
      />
      <Button type="submit">Perbarui Status</Button>
    </form>
  );
}
