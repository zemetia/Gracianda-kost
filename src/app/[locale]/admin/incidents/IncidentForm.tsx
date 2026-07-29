'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createIncidentAction, type IncidentFormState } from './actions';

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

const CATEGORY_LABEL: Record<string, string> = {
  PELANGGARAN_ATURAN: 'Pelanggaran Aturan',
  GANGGUAN: 'Gangguan',
  KERUSAKAN: 'Kerusakan',
  KEHILANGAN: 'Kehilangan',
  KELUHAN_PENGHUNI: 'Keluhan Penghuni',
  LAPORAN_SECURITY: 'Laporan Security',
};

const initialState: IncidentFormState = {};

export function IncidentForm({
  properties,
  rooms,
  initialPropertyId,
  initialRoomId,
}: {
  properties: Property[];
  rooms: Room[];
  initialPropertyId?: string | undefined;
  initialRoomId?: string | undefined;
}) {
  const [state, formAction, isPending] = useActionState(createIncidentAction, initialState);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId ?? '');

  const filteredRooms = rooms.filter((room) => room.propertyId === selectedPropertyId);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            Kategori <span className="text-destructive">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Pilih kategori</option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.category && (
            <p className="text-xs text-destructive">{state.fieldErrors.category[0]}</p>
          )}
        </div>

        <Input label="Tanggal" name="date" type="date" required error={state.fieldErrors?.date?.[0]} />

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

        {selectedPropertyId ? (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
            <label htmlFor="roomId" className="text-sm font-medium text-foreground">
              Kamar / Unit (opsional)
            </label>
            <select
              id="roomId"
              name="roomId"
              defaultValue={initialRoomId ?? ''}
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tidak terkait kamar/unit</option>
              {filteredRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  No. {room.number} {room.floor ? `(${room.floor.name})` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Kamar / Unit (opsional)</label>
            <select
              disabled
              className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground-subtle/50 opacity-60 cursor-not-allowed"
            >
              <option value="">Pilih properti terlebih dahulu</option>
            </select>
          </div>
        )}

        <Input
          label="Lokasi (jika bukan kamar, mis: Parkiran, Lobi)"
          name="location"
          placeholder="Parkiran, Lobi, dst"
          error={state.fieldErrors?.location?.[0]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Deskripsi <span className="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
        )}
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
