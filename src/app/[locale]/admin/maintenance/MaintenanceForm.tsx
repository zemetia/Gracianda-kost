'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createMaintenanceAction, type MaintenanceFormState } from './actions';

interface Property {
  id: string;
  name: string;
}

interface Room {
  id: string;
  number: string;
  propertyId: string;
  floor: { name: string } | null;
}

const initialState: MaintenanceFormState = {};

export function MaintenanceForm({
  properties,
  rooms,
  categories,
  initialPropertyId,
  initialRoomId,
}: {
  properties: Property[];
  rooms: Room[];
  categories: string[];
  initialPropertyId?: string | undefined;
  initialRoomId?: string | undefined;
}) {
  const [state, formAction, isPending] = useActionState(createMaintenanceAction, initialState);
  const [scope, setScope] = useState<'ROOM' | 'BUILDING'>('ROOM');
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId ?? '');

  const filteredRooms = rooms.filter((room) => room.propertyId === selectedPropertyId);

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
          Per Kamar / Unit
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="scope"
            value="BUILDING"
            checked={scope === 'BUILDING'}
            onChange={() => setScope('BUILDING')}
          />
          Seluruh Properti / Gedung
        </label>
      </fieldset>

      {/* Property Selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="propertyId" className="text-sm font-medium text-foreground">
          Properti <span className="text-destructive">*</span>
        </label>
        <select
          id="propertyId"
          name="propertyId"
          required
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Pilih properti</option>
          {properties.map((prop) => (
            <option key={prop.id} value={prop.id}>
              {prop.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.propertyId && (
          <p className="text-xs text-destructive">{state.fieldErrors.propertyId[0]}</p>
        )}
      </div>

      {scope === 'ROOM' && selectedPropertyId && (
        <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
          <label htmlFor="roomId" className="text-sm font-medium text-foreground">
            Kamar / Unit <span className="text-destructive">*</span>
          </label>
          <select
            id="roomId"
            name="roomId"
            required={scope === 'ROOM'}
            defaultValue={initialRoomId ?? ''}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Pilih kamar/unit</option>
            {filteredRooms.map((room) => (
              <option key={room.id} value={room.id}>
                No. {room.number} {room.floor ? `(${room.floor.name})` : ''}
              </option>
            ))}
          </select>
          {state.fieldErrors?.roomId && (
            <p className="text-xs text-destructive">{state.fieldErrors.roomId[0]}</p>
          )}
        </div>
      )}

      {scope === 'ROOM' && !selectedPropertyId && (
        <p className="text-sm text-foreground-subtle italic">Pilih properti terlebih dahulu untuk memuat daftar kamar.</p>
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
