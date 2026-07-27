'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createIncidentAction, type IncidentFormState } from './actions';

interface Room {
  id: string;
  number: string;
  floor: { name: string };
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

export function IncidentForm({ rooms }: { rooms: Room[] }) {
  const [state, formAction, isPending] = useActionState(createIncidentAction, initialState);

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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="roomId" className="text-sm font-medium text-foreground">
            Kamar (opsional)
          </label>
          <select
            id="roomId"
            name="roomId"
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tidak terkait kamar</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.number} ({room.floor.name})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Lokasi (jika bukan kamar)"
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
