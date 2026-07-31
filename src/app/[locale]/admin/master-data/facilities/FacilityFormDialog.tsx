'use client';

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Form';
import { IconPicker } from '@/components/ui/IconPicker';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDismissable } from '@/hooks/useDismissable';

import { createFacilityAction, updateFacilityAction, type FacilityFormState } from './actions';

export interface FacilityFormDialogFacility {
  id: string;
  name: string;
  icon: string | null;
  category: 'COMMON' | 'ROOM';
}

interface FacilityFormDialogProps {
  mode: 'create' | 'edit';
  facility?: FacilityFormDialogFacility;
  /** Renders whatever opens the dialog — a "Tambah" button, an edit icon. */
  renderTrigger: (open: () => void) => ReactNode;
}

const initialState: FacilityFormState = {};

/**
 * Add and edit share one form body: same fields, same validation, only the
 * bound Server Action differs. Kept page-local rather than promoted to
 * `ui/` — nothing else in the app needs a two-mode facility form.
 */
export function FacilityFormDialog({ mode, facility, renderTrigger }: FacilityFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState(facility?.icon ?? '');

  const boundAction =
    mode === 'edit' && facility
      ? updateFacilityAction.bind(null, facility.id)
      : createFacilityAction;
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasPending = useRef(false);

  const close = () => setOpen(false);
  useDismissable(panelRef, open && !isPending, close);

  const openDialog = () => {
    setIcon(facility?.icon ?? '');
    setOpen(true);
  };

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error && !state.fieldErrors) {
      toast.success(
        mode === 'edit' ? `Fasilitas ${facility?.name} diperbarui` : 'Fasilitas ditambahkan',
      );
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state, mode, facility?.name]);

  return (
    <>
      {renderTrigger(openDialog)}

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-foreground/40 absolute inset-0" aria-hidden />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="border-border bg-card shadow-popover relative w-full max-w-md rounded-lg border p-6"
            >
              <h2 id={titleId} className="text-foreground text-base font-semibold">
                {mode === 'edit' ? `Edit fasilitas ${facility?.name}` : 'Tambah Fasilitas'}
              </h2>

              <form action={formAction} className="mt-5 flex flex-col gap-4">
                <Input
                  label="Nama Fasilitas"
                  name="name"
                  placeholder="AC"
                  required
                  defaultValue={facility?.name}
                  error={state.fieldErrors?.name?.[0]}
                />
                <Select
                  label="Kategori"
                  name="category"
                  defaultValue={facility?.category ?? 'ROOM'}
                  options={[
                    { value: 'ROOM', label: 'Fasilitas Kamar' },
                    { value: 'COMMON', label: 'Fasilitas Umum' },
                  ]}
                  error={state.fieldErrors?.category?.[0]}
                />
                <IconPicker
                  label="Icon"
                  hint="Opsional — tampil di kartu fasilitas."
                  name="icon"
                  value={icon}
                  onValueChange={setIcon}
                  error={state.fieldErrors?.icon?.[0]}
                />

                <FormError message={state.error} />

                <div className="mt-1 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
                    Batal
                  </Button>
                  <Button type="submit" isLoading={isPending}>
                    {mode === 'edit' ? 'Simpan' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
