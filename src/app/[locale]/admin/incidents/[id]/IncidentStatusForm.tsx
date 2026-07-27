'use client';

import { Button } from '@/components/ui/Button';

import { updateIncidentStatusAction } from '../actions';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'OPEN', label: 'Terbuka' },
  { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' },
];

export function IncidentStatusForm({ incidentId, currentStatus }: { incidentId: string; currentStatus: string }) {
  return (
    <form action={updateIncidentStatusAction.bind(null, incidentId)} className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-foreground">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit">Perbarui Status</Button>
    </form>
  );
}
