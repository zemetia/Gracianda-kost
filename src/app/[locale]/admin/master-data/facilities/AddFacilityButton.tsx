'use client';

import { Button } from '@/components/ui/Button';

import { FacilityFormDialog } from './FacilityFormDialog';

/**
 * Owns the "Tambah Fasilitas" trigger on the client. The page is a Server
 * Component, and `renderTrigger` is a function — it cannot cross the RSC
 * boundary, so the trigger lives here instead of in `page.tsx`.
 */
export function AddFacilityButton() {
  return (
    <FacilityFormDialog
      mode="create"
      renderTrigger={(open) => (
        <Button type="button" onClick={open}>
          Tambah Fasilitas
        </Button>
      )}
    />
  );
}
