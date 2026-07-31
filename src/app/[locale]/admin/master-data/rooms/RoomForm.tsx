'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ChipGroup, ChipToggle } from '@/components/ui/Chip';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

import type { RoomFormState } from './actions';

interface Floor {
  id: string;
  name: string;
}

interface Facility {
  id: string;
  name: string;
  category: 'COMMON' | 'ROOM';
}

const FACILITY_GROUPS = [
  { category: 'ROOM', label: 'Fasilitas Kamar' },
  { category: 'COMMON', label: 'Fasilitas Umum' },
] as const;

const EXTRA_CYCLES = [
  { name: 'priceDaily', label: 'Harian', cycle: 'DAILY', interval: 1 },
  { name: 'priceWeekly', label: 'Mingguan', cycle: 'WEEKLY', interval: 1 },
  { name: 'priceQuarterly', label: '3 Bulanan', cycle: 'MONTHLY', interval: 3 },
  { name: 'priceSemiAnnual', label: '6 Bulanan', cycle: 'MONTHLY', interval: 6 },
  { name: 'priceYearly', label: 'Tahunan', cycle: 'YEARLY', interval: 1 },
] as const;

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

  const findPrice = (cycle: string, interval: number) =>
    initial?.prices?.find((p) => p.billingCycle === cycle && p.interval === interval)?.price;

  return (
    <form action={formAction}>
      <input type="hidden" name="propertyId" value={propertyId} />

      <FormLayout>
        <FormCard title="Identitas Unit" description="Nomor kamar dan posisinya di dalam properti.">
          <FormGrid columns={3}>
            <Input
              label="Nomor / Nama Unit"
              name="number"
              required
              defaultValue={initial?.number}
              error={state.fieldErrors?.number?.[0]}
            />
            <Select
              name="floorId"
              label="Lantai"
              placeholder="Tanpa Lantai"
              allowEmpty
              defaultValue={initial?.floorId || ''}
              options={floors.map((floor) => ({ value: floor.id, label: floor.name }))}
              error={state.fieldErrors?.floorId?.[0]}
            />
            <Input
              label="Ukuran"
              name="sizeSqm"
              type="number"
              min={0}
              step="0.1"
              rightAddon="m²"
              inputClassName="text-right tabular-nums"
              defaultValue={initial?.sizeSqm ?? undefined}
              error={state.fieldErrors?.sizeSqm?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormCard
          title="Harga Sewa"
          description="Harga bulanan wajib diisi. Siklus lain opsional — hanya yang terisi yang muncul saat membuat kontrak."
        >
          <CurrencyInput
            label="Harga Sewa / Bulan"
            name="price"
            required
            className="sm:max-w-sm"
            defaultValue={initial?.price}
            error={state.fieldErrors?.price?.[0]}
          />

          <FormGrid columns={3}>
            {EXTRA_CYCLES.map((entry) => (
              <CurrencyInput
                key={entry.name}
                label={entry.label}
                name={entry.name}
                defaultValue={findPrice(entry.cycle, entry.interval) ?? ''}
              />
            ))}
          </FormGrid>
        </FormCard>

        <FormCard title="Detail & Fasilitas" description="Tampil di halaman publik kamar.">
          <Textarea
            name="description"
            label="Deskripsi"
            defaultValue={initial?.description ?? undefined}
          />

          {facilities.length > 0 ? (
            FACILITY_GROUPS.map(({ category, label }) => {
              const items = facilities.filter((facility) => facility.category === category);
              if (items.length === 0) return null;

              return (
                <ChipGroup key={category} label={label}>
                  {items.map((facility) => (
                    <ChipToggle
                      key={facility.id}
                      name="facilityIds"
                      value={facility.id}
                      label={facility.name}
                      defaultChecked={initial?.facilityIds.includes(facility.id) ?? false}
                    />
                  ))}
                </ChipGroup>
              );
            })
          ) : (
            <p className="text-sm text-foreground-muted">
              Belum ada fasilitas — tambahkan di menu Fasilitas.
            </p>
          )}
        </FormCard>

        <FormCard title="Status" description="Kamar nonaktif tidak muncul di website publik.">
          <Checkbox
            name="isActive"
            value="true"
            defaultChecked={initial?.isActive ?? true}
            label="Aktif"
            hint="Tampil di website publik dan bisa dipakai untuk kontrak baru."
          />
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar secondary="Perubahan langsung terlihat di halaman publik kamar.">
          <Button type="submit" isLoading={isPending}>
            {submitLabel}
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
