'use client';

import { Plus } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { useDismissable } from '@/hooks/useDismissable';

import { createFloorAction, type FloorFormState } from './actions';

const initialState: FloorFormState = {};

export function NewFloorForm({ propertyId }: { propertyId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createFloorAction, initialState);
  const panelRef = useRef<HTMLDivElement>(null);

  // `state` only changes reference once the action actually runs — a bare
  // `{}` on success means "nothing went wrong", so close the dialog. This
  // adjusts state during render (React's documented alternative to an
  // effect) rather than setting state as a side effect of one.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (!state.error && !state.fieldErrors) setIsOpen(false);
  }

  useDismissable(panelRef, isOpen && !isPending, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Plus className="h-4 w-4" />}
        onClick={() => setIsOpen(true)}
      >
        Tambah Lantai
      </Button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-foreground/40" aria-hidden />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-floor-title"
                className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-popover"
              >
                <h2 id="new-floor-title" className="text-base font-semibold text-foreground">
                  Tambah Lantai
                </h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  Lantai baru akan tersedia sebagai pilihan saat menambah kamar.
                </p>

                <form action={formAction} className="mt-5 flex flex-col gap-4">
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <Input
                    label="Nama Lantai"
                    name="name"
                    placeholder="Lantai 1"
                    required
                    autoFocus
                    error={state.fieldErrors?.name?.[0]}
                  />
                  <Input
                    label="Urutan"
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={0}
                    required
                    hint="Menentukan urutan tampil, dari yang terkecil."
                    error={state.fieldErrors?.order?.[0]}
                  />

                  <FormError message={state.error} />

                  <div className="mt-1 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      disabled={isPending}
                    >
                      Batal
                    </Button>
                    <Button type="submit" isLoading={isPending}>
                      Simpan Lantai
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
