'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker, toISODate } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { formatRupiah } from '@/lib/utils';

import type { ContractFormState } from '../actions';

type Cycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const CYCLE_UNIT: Record<Cycle, string> = {
  DAILY: 'Hari',
  WEEKLY: 'Minggu',
  MONTHLY: 'Bulan',
  YEARLY: 'Tahun',
};

const CYCLE_OPTIONS = [
  { value: 'DAILY', label: 'Harian' },
  { value: 'WEEKLY', label: 'Mingguan' },
  { value: 'MONTHLY', label: 'Bulanan' },
  { value: 'YEARLY', label: 'Tahunan' },
];

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

  return toISODate(date);
}

export function ContractTermForm({ action, defaults, submitLabel, rooms }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [roomId, setRoomId] = useState('');
  const [cycle, setCycle] = useState<Cycle>(defaults.billingCycle);
  const [interval, setInterval] = useState(defaults.billingInterval);
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(() =>
    addTerm(defaults.startDate, defaults.billingCycle, defaults.billingInterval, 1),
  );
  const [rentPrice, setRentPrice] = useState<number | ''>(defaults.rentPrice);

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
    <form action={formAction}>
      <FormLayout>
        {rooms && (
          <FormCard title="Kamar Tujuan" description="Unit kosong yang akan ditempati penyewa.">
            <Select
              name="roomId"
              label="Kamar Tujuan"
              required
              placeholder="Pilih kamar tersedia"
              value={roomId}
              onValueChange={(next) => {
                setRoomId(next);
                const room = rooms.find((option) => option.id === next);
                if (room) setRentPrice(room.price);
              }}
              options={rooms.map((room) => ({
                value: room.id,
                label: `${room.propertyName} — No. ${room.number}${room.floorName ? ` (${room.floorName})` : ''}`,
                hint: formatRupiah(room.price),
              }))}
              error={state.fieldErrors?.roomId?.[0]}
              {...(rooms.length === 0
                ? {
                    hint: 'Tidak ada kamar kosong saat ini. Kosongkan kamar lain dulu sebelum memindahkan penyewa.',
                  }
                : {})}
            />
          </FormCard>
        )}

        <FormCard title="Siklus & Tarif" description="Tanggal berakhir dihitung otomatis dari durasi.">
          <FormGrid columns={3}>
            <Select
              name="billingCycle"
              label="Siklus Sewa"
              value={cycle}
              onValueChange={(next) => {
                setCycle(next as Cycle);
                recalcEnd({ cycle: next as Cycle });
              }}
              options={CYCLE_OPTIONS}
            />

            <Input
              label="Setiap (Interval)"
              name="billingInterval"
              type="number"
              min={1}
              inputClassName="text-right tabular-nums"
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
              inputClassName="text-right tabular-nums"
              value={duration}
              onChange={(event) => {
                const next = Number(event.target.value);
                setDuration(next);
                recalcEnd({ duration: next });
              }}
            />
          </FormGrid>

          <FormGrid>
            <CurrencyInput
              label="Harga Sewa"
              name="rentPrice"
              required
              value={rentPrice}
              onValueChange={setRentPrice}
              error={state.fieldErrors?.rentPrice?.[0]}
            />

            <CurrencyInput
              label="Deposit"
              name="deposit"
              defaultValue={defaults.deposit ?? ''}
              hint="Kosongkan untuk memakai deposit kontrak sebelumnya."
            />
          </FormGrid>
        </FormCard>

        <FormCard title="Masa Sewa" description="Tanggal berakhir bisa diubah kalau ada kesepakatan lain.">
          <FormGrid>
            <DatePicker
              label="Tanggal Mulai"
              name="startDate"
              required
              value={startDate}
              onValueChange={(next) => {
                setStartDate(next);
                recalcEnd({ startDate: next });
              }}
              error={state.fieldErrors?.startDate?.[0]}
            />

            <DatePicker
              label="Tanggal Berakhir"
              name="endDate"
              hint="Terisi otomatis, masih bisa diubah."
              value={endDate}
              onValueChange={setEndDate}
              {...(startDate ? { min: startDate } : {})}
            />
          </FormGrid>

          <Textarea name="notes" label="Catatan" rows={2} />
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar>
          <Button type="submit" isLoading={isPending}>
            {submitLabel}
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
