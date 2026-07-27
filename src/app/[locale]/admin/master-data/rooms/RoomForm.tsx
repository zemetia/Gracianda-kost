'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';

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
  propertyId: string;
  floors: Floor[];
  facilities: Facility[];
  initial?: {
    number: string;
    floorId: string | null;
    price: number;
    sizeSqm: number | null;
    description: string | null;
    isActive: boolean;
    facilityIds: string[];
    prices?: { billingCycle: string; interval: number; price: number }[];
  };
  submitLabel: string;
}

const initialState: RoomFormState = {};

export function RoomForm({ action, propertyId, floors, facilities, initial, submitLabel }: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const findPrice = (cycle: string, interval: number) => {
    return initial?.prices?.find((p) => p.billingCycle === cycle && p.interval === interval)?.price;
  };

  const initialPriceDaily = findPrice('DAILY', 1);
  const initialPriceWeekly = findPrice('WEEKLY', 1);
  const initialPriceQuarterly = findPrice('MONTHLY', 3);
  const initialPriceSemiAnnual = findPrice('MONTHLY', 6);
  const initialPriceYearly = findPrice('YEARLY', 1);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="propertyId" value={propertyId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nomor / Nama Unit"
          name="number"
          required
          defaultValue={initial?.number}
          error={state.fieldErrors?.number?.[0]}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="floorId" className="text-sm font-medium text-foreground">
            Lantai (Opsional)
          </label>
          <select
            id="floorId"
            name="floorId"
            defaultValue={initial?.floorId || ''}
            className="h-9 rounded-md border border-input bg-surface px-3 text-sm text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tanpa Lantai</option>
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
          label="Harga Sewa / Bulan"
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

      <div className="border border-border/40 bg-surface-raised/20 rounded-xl p-5 flex flex-col gap-4">
        <Typography variant="small" className="font-semibold text-foreground-muted">
          Pilihan Siklus Harga Sewa Tambahan (Opsional)
        </Typography>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Harga Harian (Rp)"
            name="priceDaily"
            type="number"
            min={0}
            step="1000"
            defaultValue={initialPriceDaily ?? ''}
          />
          <Input
            label="Harga Mingguan (Rp)"
            name="priceWeekly"
            type="number"
            min={0}
            step="1000"
            defaultValue={initialPriceWeekly ?? ''}
          />
          <Input
            label="Harga 3 Bulanan (Rp)"
            name="priceQuarterly"
            type="number"
            min={0}
            step="1000"
            defaultValue={initialPriceQuarterly ?? ''}
          />
          <Input
            label="Harga 6 Bulanan (Rp)"
            name="priceSemiAnnual"
            type="number"
            min={0}
            step="1000"
            defaultValue={initialPriceSemiAnnual ?? ''}
          />
          <Input
            label="Harga Tahunan (Rp)"
            name="priceYearly"
            type="number"
            min={0}
            step="1000"
            defaultValue={initialPriceYearly ?? ''}
          />
        </div>
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
          value="true"
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
