'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ChipGroup, ChipToggle } from '@/components/ui/Chip';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/Radio';
import { Textarea } from '@/components/ui/Textarea';
import { PRICE_TIER_FIELDS } from '@/lib/billing';
import { ELECTRICITY_MODES, type ElectricityMode } from '@/lib/electricity';

import type { RoomTypeFormState } from './actions';

interface Facility {
  id: string;
  name: string;
  category: 'COMMON' | 'ROOM';
}

const FACILITY_GROUPS = [
  { category: 'ROOM', label: 'Fasilitas Kamar' },
  { category: 'COMMON', label: 'Fasilitas Umum' },
] as const;

interface RoomTypeFormProps {
  action: (prevState: RoomTypeFormState, formData: FormData) => Promise<RoomTypeFormState>;
  propertyId: string;
  facilities: Facility[];
  initial?: {
    name: string;
    description: string | null;
    sizeSqm: number | null;
    price: number | null;
    electricityMode: ElectricityMode;
    isActive: boolean;
    facilityIds: string[];
    prices?: { billingCycle: string; interval: number; price: number }[];
  };
  submitLabel: string;
}

const initialState: RoomTypeFormState = {};

export function RoomTypeForm({
  action,
  propertyId,
  facilities,
  initial,
  submitLabel,
}: RoomTypeFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const findPrice = (cycle: string, interval: number) =>
    initial?.prices?.find((p) => p.billingCycle === cycle && p.interval === interval)?.price;

  return (
    <form action={formAction}>
      <input type="hidden" name="propertyId" value={propertyId} />

      <FormLayout>
        <FormCard
          title="Identitas Tipe"
          description="Nama yang dipakai admin saat membuat kamar — mis. Tipe A, Deluxe AC."
        >
          <FormGrid columns={2}>
            <Input
              label="Nama Tipe"
              name="name"
              required
              defaultValue={initial?.name}
              error={state.fieldErrors?.name?.[0]}
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

          <Textarea
            name="description"
            label="Deskripsi"
            hint="Dipakai kamar yang tidak menulis deskripsinya sendiri."
            defaultValue={initial?.description ?? undefined}
          />
        </FormCard>

        <FormCard
          title="Harga Acuan"
          description="Hanya nilai awal — begitu kamar dibuat, harga kamar itu yang dipakai untuk kontrak dan tagihan."
        >
          <CurrencyInput
            label="Harga Sewa / Bulan"
            name="price"
            className="sm:max-w-sm"
            defaultValue={initial?.price ?? ''}
            error={state.fieldErrors?.price?.[0]}
          />

          <FormGrid columns={3}>
            {PRICE_TIER_FIELDS.map((tier) => (
              <CurrencyInput
                key={tier.field}
                label={tier.label}
                name={tier.field}
                defaultValue={findPrice(tier.billingCycle, tier.interval) ?? ''}
              />
            ))}
          </FormGrid>
        </FormCard>

        <FormCard
          title="Listrik"
          description="Nilai awal juga — kamar yang memakai tipe ini mewarisinya saat dibuat, lalu boleh diubah sendiri."
        >
          <RadioGroup
            name="electricityMode"
            label="Cara Pembayaran Listrik"
            defaultValue={initial?.electricityMode ?? 'FREE'}
            options={ELECTRICITY_MODES.map((mode) => ({
              value: mode.value,
              label: mode.label,
              hint: mode.hint,
            }))}
            error={state.fieldErrors?.electricityMode?.[0]}
          />
        </FormCard>

        <FormCard
          title="Fasilitas Tipe"
          description="Berlaku untuk semua kamar bertipe ini — kecuali kamar itu mengisi fasilitasnya sendiri."
        >
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

        <FormCard title="Status" description="Tipe nonaktif tidak bisa dipilih saat membuat kamar.">
          <Checkbox
            name="isActive"
            value="true"
            defaultChecked={initial?.isActive ?? true}
            label="Aktif"
            hint="Kamar yang sudah memakai tipe ini tetap mewarisi fasilitas dan fotonya."
          />
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar secondary="Perubahan fasilitas & foto tipe langsung berlaku untuk kamar yang mewarisinya.">
          <Button type="submit" isLoading={isPending}>
            {submitLabel}
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
