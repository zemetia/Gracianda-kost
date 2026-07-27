'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PropertyFormState } from './actions';

interface PropertyFormProps {
  action: (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  initial?: {
    name: string;
    code: string;
    type: 'KOST' | 'HOUSE' | 'APARTMENT' | 'VILLA' | 'OTHER';
    address: string | null;
    description: string | null;
    isActive: boolean;
  };
  submitLabel: string;
}

const initialState: PropertyFormState = {};

export function PropertyForm({ action, initial, submitLabel }: PropertyFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nama Properti"
          name="name"
          required
          placeholder="Contoh: Gracianda House, Cempaka Townhouse"
          defaultValue={initial?.name}
          error={state.fieldErrors?.name?.[0]}
        />

        <Input
          label="Kode Properti (Prefix Kode Kontrak)"
          name="code"
          required
          placeholder="Contoh: GH, CH, APT"
          defaultValue={initial?.code}
          error={state.fieldErrors?.code?.[0]}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className="text-sm font-medium text-foreground">
            Tipe Properti <span className="text-destructive">*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={initial?.type ?? 'KOST'}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="KOST">Rumah Kost (Bulanan per kamar)</option>
            <option value="HOUSE">Rumah / Villa (Sewa satu rumah penuh)</option>
            <option value="APARTMENT">Apartemen</option>
            <option value="VILLA">Villa</option>
            <option value="OTHER">Lainnya</option>
          </select>
          {state.fieldErrors?.type && (
            <p className="text-xs text-destructive">{state.fieldErrors.type[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="address" className="text-sm font-medium text-foreground">
          Alamat
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={initial?.address ?? undefined}
          className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.fieldErrors?.address && (
          <p className="text-xs text-destructive">{state.fieldErrors.address[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? undefined}
          className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground-muted">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-input"
        />
        Aktif (dapat digunakan untuk transaksi dan tampil di publik)
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" isLoading={isPending} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
