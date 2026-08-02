'use client';

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormError } from '@/components/ui/Form';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useDismissable } from '@/hooks/useDismissable';
import { BLACKLIST_REASON_OPTIONS } from '@/lib/blacklist';

import { setBlacklistAction, type BlacklistFormState } from './actions';

export interface BlacklistCandidate {
  id: string;
  fullName: string;
  ktpNumber: string;
  phone: string;
}

interface BlacklistDialogProps {
  /**
   * `add` memilih penyewanya lewat Combobox; `edit` sudah terkunci ke satu
   * orang dan hanya menyunting kategori & kronologinya.
   */
  mode: 'add' | 'edit';
  /** Wajib di mode `add` — penyewa yang belum ada di daftar hitam. */
  candidates?: BlacklistCandidate[];
  /** Wajib di mode `edit`. */
  tenant?: { id: string; fullName: string; reason: string | null; note: string | null };
  /** Merender apa pun yang membuka dialog — tombol, ikon pensil. */
  renderTrigger: (open: () => void) => ReactNode;
}

const initialState: BlacklistFormState = {};

/**
 * Memasukkan orang ke daftar hitam dan menyunting entrinya adalah form yang
 * sama, jadi komponennya satu: yang berbeda cuma apakah penyewanya masih bisa
 * dipilih. Sengaja tetap page-local — tidak ada layar lain yang butuh bentuk
 * form ini.
 */
export function BlacklistDialog({ mode, candidates, tenant, renderTrigger }: BlacklistDialogProps) {
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState(tenant?.id ?? '');
  const [state, formAction, isPending] = useActionState(setBlacklistAction, initialState);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasPending = useRef(false);

  const close = () => setOpen(false);
  useDismissable(panelRef, open && !isPending, close);

  const openDialog = () => {
    setTenantId(tenant?.id ?? '');
    setOpen(true);
  };

  const selectedName =
    tenant?.fullName ?? candidates?.find((candidate) => candidate.id === tenantId)?.fullName;

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error && !state.fieldErrors) {
      toast.success(
        mode === 'edit' ? 'Entri blacklist diperbarui' : `${selectedName ?? 'Penyewa'} masuk daftar hitam`,
      );
      setOpen(false);
    }
    wasPending.current = isPending;
  }, [isPending, state, mode, selectedName]);

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
              className="border-border bg-card shadow-popover relative w-full max-w-lg rounded-lg border p-6"
            >
              <h2 id={titleId} className="text-foreground text-base font-semibold">
                {mode === 'edit'
                  ? `Ubah entri blacklist ${tenant?.fullName}`
                  : 'Tambah ke Daftar Hitam'}
              </h2>
              <p className="text-foreground-muted mt-1 text-sm">
                Blacklist tidak memblokir kontrak baru — ia memunculkan peringatan yang harus
                dikonfirmasi admin. Isi kronologinya supaya orang yang mengonfirmasi tahu apa yang
                ia setujui.
              </p>

              <form action={formAction} className="mt-5 flex flex-col gap-4">
                {mode === 'edit' ? (
                  <input type="hidden" name="tenantId" value={tenant?.id ?? ''} />
                ) : (
                  <Combobox
                    name="tenantId"
                    label="Penyewa"
                    value={tenantId}
                    onValueChange={setTenantId}
                    placeholder="Cari nama, KTP, atau nomor HP"
                    emptyText="Tidak ada penyewa yang cocok."
                    required
                    error={state.fieldErrors?.tenantId?.[0]}
                    options={(candidates ?? []).map((candidate) => ({
                      value: candidate.id,
                      label: candidate.fullName,
                      hint: `KTP ${candidate.ktpNumber} · ${candidate.phone}`,
                    }))}
                  />
                )}

                <Select
                  name="blacklistReason"
                  label="Kategori"
                  required
                  placeholder="Pilih kategori pelanggaran"
                  defaultValue={tenant?.reason ?? ''}
                  options={BLACKLIST_REASON_OPTIONS}
                  error={state.fieldErrors?.blacklistReason?.[0]}
                />

                <Textarea
                  name="blacklistNote"
                  label="Kronologi"
                  rows={5}
                  required
                  defaultValue={tenant?.note ?? ''}
                  placeholder="Apa yang terjadi, kapan, dan apa yang sudah diupayakan. Sebut nominal atau nomor kontrak kalau ada."
                  hint="Tercatat di audit log dan terbaca admin lain saat orang ini mendaftar lagi."
                  error={state.fieldErrors?.blacklistNote?.[0]}
                />

                <FormError message={state.error} />

                <div className="mt-1 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
                    Batal
                  </Button>
                  <Button type="submit" isLoading={isPending}>
                    {mode === 'edit' ? 'Simpan' : 'Masukkan ke Blacklist'}
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
