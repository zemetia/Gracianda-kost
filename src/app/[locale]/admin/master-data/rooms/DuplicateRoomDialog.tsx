'use client';

import { Copy } from 'lucide-react';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { useDismissable } from '@/hooks/useDismissable';
import { generateRoomNumbers } from '@/lib/room-template';

import { duplicateRoomAction, type DuplicateRoomState } from './actions';

interface Floor {
  id: string;
  name: string;
}

interface DuplicateRoomDialogProps {
  roomId: string;
  roomNumber: string;
  floorId: string | null;
  floors: Floor[];
}

type Mode = 'SEQUENCE' | 'LIST';

const MODE_OPTIONS = [
  { value: 'SEQUENCE' as const, label: 'Nomor berurutan' },
  { value: 'LIST' as const, label: 'Daftar nomor' },
];

const initialState: DuplicateRoomState = {};

/**
 * Filling a floor means creating the same room ten times. This clones one unit
 * — harga, fasilitas, tipe — into a whole batch, with a live preview of the
 * numbers so the admin never discovers the numbering was wrong ten rooms later.
 */
export function DuplicateRoomDialog({
  roomId,
  roomNumber,
  floorId,
  floors,
}: DuplicateRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('SEQUENCE');
  const [count, setCount] = useState('5');
  const [prefix, setPrefix] = useState('');
  const [startNumber, setStartNumber] = useState('');
  const [numbers, setNumbers] = useState('');
  const [state, formAction, isPending] = useActionState(
    duplicateRoomAction.bind(null, roomId),
    initialState,
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDismissable(panelRef, open && !isPending, () => setOpen(false));

  useEffect(() => {
    if (!state.createdCount) return;
    toast.success(`${state.createdCount} unit dibuat dari kamar ${roomNumber}.`);
    // The action result is the only signal that the batch landed; closing here
    // is the reaction to it, not a render-driven state sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [state.createdCount, roomNumber]);

  const preview = generateRoomNumbers({
    mode,
    count: Number(count) || 0,
    prefix,
    startNumber,
    numbers,
    floorId: null,
  });

  return (
    <>
      <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(true)}>
        <Copy className="h-4 w-4" aria-hidden />
        Duplikat
      </Button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/40" aria-hidden />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-popover"
            >
              <h2 id={titleId} className="text-base font-semibold text-foreground">
                Duplikat kamar {roomNumber}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                Harga, siklus, tipe, dan fasilitas ikut tersalin. Foto tidak — kamar baru memakai
                foto tipenya.
              </p>

              <form action={formAction} className="mt-5 flex flex-col gap-5">
                <input type="hidden" name="mode" value={mode} />

                <SegmentedControl
                  label="Penomoran"
                  options={MODE_OPTIONS}
                  value={mode}
                  onValueChange={setMode}
                />

                {mode === 'SEQUENCE' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input
                      label="Awalan"
                      name="prefix"
                      placeholder="A"
                      value={prefix}
                      onChange={(event) => setPrefix(event.target.value)}
                    />
                    <Input
                      label="Nomor awal"
                      name="startNumber"
                      inputMode="numeric"
                      placeholder="101"
                      hint="Angka nol di depan dipertahankan."
                      value={startNumber}
                      onChange={(event) => setStartNumber(event.target.value)}
                      error={state.fieldErrors?.startNumber?.[0]}
                    />
                    <Input
                      label="Jumlah salinan"
                      name="count"
                      type="number"
                      min={1}
                      max={50}
                      value={count}
                      onChange={(event) => setCount(event.target.value)}
                      error={state.fieldErrors?.count?.[0]}
                    />
                  </div>
                ) : (
                  <Input
                    label="Nomor unit"
                    name="numbers"
                    placeholder="A2, A3, A4"
                    hint="Pisahkan dengan koma."
                    value={numbers}
                    onChange={(event) => setNumbers(event.target.value)}
                    error={state.fieldErrors?.numbers?.[0]}
                  />
                )}

                <Select
                  name="floorId"
                  label="Lantai tujuan"
                  placeholder="Sama seperti kamar sumber"
                  allowEmpty
                  defaultValue=""
                  options={floors.map((floor) => ({ value: floor.id, label: floor.name }))}
                  hint={floorId ? undefined : 'Kamar sumber tidak berada di lantai mana pun.'}
                />

                <div className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm">
                  <span className="text-foreground-muted">Akan dibuat: </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {preview.length > 0 ? preview.join(', ') : '—'}
                  </span>
                </div>

                <FormError message={state.error} />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    Batal
                  </Button>
                  <Button type="submit" isLoading={isPending} disabled={preview.length === 0}>
                    Buat {preview.length > 0 ? `${preview.length} unit` : 'unit'}
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
