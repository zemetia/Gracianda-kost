'use client';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { INCIDENT_STATUS_OPTIONS } from '@/lib/incident';

import { updateIncidentStatusAction } from '../actions';

export function IncidentStatusForm({ incidentId, currentStatus }: { incidentId: string; currentStatus: string }) {
  return (
    <form action={updateIncidentStatusAction.bind(null, incidentId)} className="flex items-end gap-3">
      <Select
        name="status"
        label="Status"
        defaultValue={currentStatus}
        options={INCIDENT_STATUS_OPTIONS}
        className="sm:w-56"
      />
      <Button type="submit">Perbarui Status</Button>
    </form>
  );
}
