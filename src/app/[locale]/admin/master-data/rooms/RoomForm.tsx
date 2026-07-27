'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import type { RoomFormState } from './actions';

interface Floor {
  id: string;
  name: string;
}

interface Facility {
  id: string;
  name: string;
}

interface RoomFormProps {
  action: (prevState: RoomFormState, formData: FormData) => Promise<RoomFormState>;
  floors: Floor[];
  facilities: Facility[];
  initial?: {
    number: string;
    floorId: string;
    price: number;
    sizeSqm: number | null;
    description: string | null;
    isActive: boolean;
    facilityIds: string[];
  };
  submitLabel: string;
}

const initialState: RoomFormState = {};

export function RoomForm({ action, floors, facilities, initial, submitLabel }: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nomor Kamar"
          name="number"
          required
          defaultValue={initial?.number}
          error={state.fieldErrors?.number?.[0]}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="floorId" className="text-sm font-medium text-foreground">
            Lantai <span className="text-destructive">*</span>
          </label>
          <select
            id="floorId"
            name="floorId"
            required
            defaultValue={initial?.floorId}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Pilih lantai</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.floorId && (
            <p className="text-xs text-destructive">{state.fieldErrors.floorId[0]}</p>
          )}
        </div>

        <Input
          label="Harga / Bulan"
          name="price"
          type="number"
          min={0}
          step="1000"
          required
          defaultValue={initial?.price}
          error={state.fieldErrors?.price?.[0]}
        />

        <Input
          label="Ukuran (m²)"
          name="sizeSqm"
          type="number"
          min={0}
          step="0.1"
          defaultValue={initial?.sizeSqm ?? undefined}
          error={state.fieldErrors?.sizeSqm?.[0]}
        />
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
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground">Fasilitas</legend>
        <div className="flex flex-wrap gap-3">
          {facilities.map((facility) => (
            <label key={facility.id} className="flex items-center gap-2 text-sm text-foreground-muted">
              <input
                type="checkbox"
                name="facilityIds"
                value={facility.id}
                defaultChecked={initial?.facilityIds.includes(facility.id)}
                className="h-4 w-4 rounded border-input"
              />
              {facility.name}
            </label>
          ))}
          {facilities.length === 0 && (
            <p className="text-sm text-foreground-subtle">Belum ada fasilitas — tambahkan di menu Fasilitas.</p>
          )}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-foreground-muted">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-input"
        />
        Aktif (tampil di website publik)
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
