'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createMaintenanceAction, type MaintenanceFormState } from './actions';

interface Room {
  id: string;
  number: string;
  floor: { name: string };
}

const initialState: MaintenanceFormState = {};

export function MaintenanceForm({ rooms, categories }: { rooms: Room[]; categories: string[] }) {
  const [state, formAction, isPending] = useActionState(createMaintenanceAction, initialState);
  const [scope, setScope] = useState<'ROOM' | 'BUILDING'>('ROOM');

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scope"
            value="ROOM"
            checked={scope === 'ROOM'}
            onChange={() => setScope('ROOM')}
          />
          Per Kamar
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scope"
            value="BUILDING"
            checked={scope === 'BUILDING'}
            onChange={() => setScope('BUILDING')}
          />
          Seluruh Gedung
        </label>
      </fieldset>

      {scope === 'ROOM' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="roomId" className="text-sm font-medium text-foreground">
            Kamar <span className="text-destructive">*</span>
          </label>
          <select
            id="roomId"
            name="roomId"
            required={scope === 'ROOM'}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Pilih kamar</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.number} ({room.floor.name})
              </option>
            ))}
          </select>
          {state.fieldErrors?.roomId && (
            <p className="text-xs text-destructive">{state.fieldErrors.roomId[0]}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            Kategori <span className="text-destructive">*</span>
          </label>
          <Input
            id="category"
            name="category"
            list="maintenance-categories"
            required
            error={state.fieldErrors?.category?.[0]}
          />
          <datalist id="maintenance-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>

        <Input
          label="Tanggal"
          name="date"
          type="date"
          required
          error={state.fieldErrors?.date?.[0]}
        />
        <Input label="Biaya" name="cost" type="number" min={0} step="1000" error={state.fieldErrors?.cost?.[0]} />
        <Input label="Vendor" name="vendor" error={state.fieldErrors?.vendor?.[0]} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          Catatan
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" isLoading={isPending} className="self-start">
        Simpan
      </Button>
    </form>
  );
}
