'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import type { ContractFormState } from '../actions';

type Cycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const CYCLE_UNIT: Record<Cycle, string> = {
  DAILY: 'Hari',
  WEEKLY: 'Minggu',
  MONTHLY: 'Bulan',
  YEARLY: 'Tahun',
};

export interface TermDefaults {
  rentPrice: number;
  deposit: number | null;
  billingCycle: Cycle;
  billingInterval: number;
  startDate: string;
}

export interface TransferRoomOption {
  id: string;
  number: string;
  propertyName: string;
  floorName: string | null;
  price: number;
}

interface Props {
  action: (state: ContractFormState, formData: FormData) => Promise<ContractFormState>;
  defaults: TermDefaults;
  submitLabel: string;
  /** Present only in "Pindah Kamar" — the destination room picker. */
  rooms?: TransferRoomOption[];
}

const initialState: ContractFormState = {};

function addTerm(startDate: string, cycle: Cycle, interval: number, duration: number): string {
  if (!startDate) return '';
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) return '';

  const steps = interval * duration;
  if (cycle === 'DAILY') date.setDate(date.getDate() + steps);
  else if (cycle === 'WEEKLY') date.setDate(date.getDate() + steps * 7);
  else if (cycle === 'MONTHLY') date.setMonth(date.getMonth() + steps);
  else date.setFullYear(date.getFullYear() + steps);

  return date.toISOString().split('T')[0] || '';
}

export function ContractTermForm({ action, defaults, submitLabel, rooms }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [cycle, setCycle] = useState<Cycle>(defaults.billingCycle);
  const [interval, setInterval] = useState(defaults.billingInterval);
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(() =>
    addTerm(defaults.startDate, defaults.billingCycle, defaults.billingInterval, 1),
  );
  const [rentPrice, setRentPrice] = useState(defaults.rentPrice);

  const recalcEnd = (next: Partial<{ cycle: Cycle; interval: number; duration: number; startDate: string }>) => {
    setEndDate(
      addTerm(
        next.startDate ?? startDate,
        next.cycle ?? cycle,
        next.interval ?? interval,
        next.duration ?? duration,
      ),
    );
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {rooms && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="roomId" className="text-sm font-medium text-foreground">
            Kamar Tujuan <span className="text-destructive">*</span>
          </label>
          <select
            id="roomId"
            name="roomId"
            required
            defaultValue=""
            onChange={(event) => {
              const room = rooms.find((option) => option.id === event.target.value);
              if (room) setRentPrice(room.price);
            }}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Pilih kamar tersedia</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.propertyName} — No. {room.number}
                {room.floorName ? ` (${room.floorName})` : ''} · Rp{' '}
                {room.price.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
          {state.fieldErrors?.roomId && (
            <p className="text-xs text-destructive">{state.fieldErrors.roomId[0]}</p>
          )}
          {rooms.length === 0 && (
            <p className="text-xs text-warning">
              Tidak ada kamar kosong saat ini. Kosongkan kamar lain dulu sebelum memindahkan penyewa.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="billingCycle" className="text-sm font-medium text-foreground">
            Siklus Sewa
          </label>
          <select
            id="billingCycle"
            name="billingCycle"
            value={cycle}
            onChange={(event) => {
              const next = event.target.value as Cycle;
              setCycle(next);
              recalcEnd({ cycle: next });
            }}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="DAILY">Harian</option>
            <option value="WEEKLY">Mingguan</option>
            <option value="MONTHLY">Bulanan</option>
            <option value="YEARLY">Tahunan</option>
          </select>
        </div>

        <Input
          label="Setiap (Interval)"
          name="billingInterval"
          type="number"
          min={1}
          value={interval}
          onChange={(event) => {
            const next = Number(event.target.value);
            setInterval(next);
            recalcEnd({ interval: next });
          }}
        />

        <Input
          label={`Durasi (${CYCLE_UNIT[cycle]})`}
          type="number"
          min={1}
          value={duration}
          onChange={(event) => {
            const next = Number(event.target.value);
            setDuration(next);
            recalcEnd({ duration: next });
          }}
        />

        <Input
          label="Harga Sewa"
          name="rentPrice"
          type="number"
          min={0}
          step="1000"
          required
          value={rentPrice || ''}
          onChange={(event) => setRentPrice(Number(event.target.value))}
          error={state.fieldErrors?.rentPrice?.[0]}
        />

        <Input
          label="Deposit"
          name="deposit"
          type="number"
          min={0}
          step="1000"
          defaultValue={defaults.deposit ?? ''}
          hint="Kosongkan untuk memakai deposit kontrak sebelumnya"
        />

        <Input
          label="Tanggal Mulai"
          name="startDate"
          type="date"
          required
          value={startDate}
          onChange={(event) => {
            setStartDate(event.target.value);
            recalcEnd({ startDate: event.target.value });
          }}
          error={state.fieldErrors?.startDate?.[0]}
        />

        <Input
          label="Tanggal Berakhir (otomatis)"
          name="endDate"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          Catatan
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

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
