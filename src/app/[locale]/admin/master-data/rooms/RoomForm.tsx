'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ChipGroup, ChipToggle } from '@/components/ui/Chip';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PRICE_TIER_FIELDS, type PriceTierField } from '@/lib/billing';
import { ELECTRICITY_MODES, type ElectricityMode } from '@/lib/electricity';

import type { RoomFormState } from './actions';

interface Floor {
  id: string;
  name: string;
}

interface Facility {
  id: string;
  name: string;
}

export interface RoomTypeOption {
  id: string;
  name: string;
  description: string | null;
  lengthM: number | null;
  widthM: number | null;
  price: number | null;
  electricityMode: ElectricityMode;
  facilityIds: string[];
  prices: { billingCycle: string; interval: number; price: number }[];
}

type TierValues = Record<PriceTierField, number | ''>;

const EMPTY_TIERS = Object.fromEntries(
  PRICE_TIER_FIELDS.map((tier) => [tier.field, '' as const]),
) as TierValues;

interface RoomFormProps {
  action: (prevState: RoomFormState, formData: FormData) => Promise<RoomFormState>;
  propertyId: string;
  floors: Floor[];
  facilities: Facility[];
  roomTypes: RoomTypeOption[];
  initial?: {
    number: string;
    floorId: string | null;
    roomTypeId: string | null;
    price: number;
    lengthM: number | null;
    widthM: number | null;
    description: string | null;
    electricityMode: ElectricityMode;
    isActive: boolean;
    facilityIds: string[];
    prices?: { billingCycle: string; interval: number; price: number }[];
  };
  submitLabel: string;
}

const initialState: RoomFormState = {};

export function RoomForm({
  action,
  propertyId,
  floors,
  facilities,
  roomTypes,
  initial,
  submitLabel,
}: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [roomTypeId, setRoomTypeId] = useState(initial?.roomTypeId ?? '');
  const [price, setPrice] = useState<number | ''>(initial?.price ?? '');
  const [tiers, setTiers] = useState<TierValues>(() => readTiers(initial?.prices));
  const [electricityMode, setElectricityMode] = useState<ElectricityMode>(
    initial?.electricityMode ?? 'FREE',
  );
  // Empty means "ikut tipe" — the room stores no facility rows of its own and
  // inherits the type's. Only an explicit override writes rows.
  const [ownFacilities, setOwnFacilities] = useState(
    () => (initial?.facilityIds.length ?? 0) > 0 || !initial?.roomTypeId,
  );

  const selectedType = roomTypes.find((type) => type.id === roomTypeId) ?? null;

  // Picking a type refills price and tiers with its defaults. They stay
  // editable afterwards — the room's own price is what billing reads.
  const applyType = (nextId: string) => {
    setRoomTypeId(nextId);
    const type = roomTypes.find((t) => t.id === nextId);
    if (!type) {
      setOwnFacilities(true);
      return;
    }
    if (type.price) setPrice(type.price);
    setTiers(readTiers(type.prices));
    setElectricityMode(type.electricityMode);
    setOwnFacilities(false);
  };

  return (
    <form action={formAction}>
      <input type="hidden" name="propertyId" value={propertyId} />

      <FormLayout>
        <FormCard title="Identitas Unit" description="Nomor kamar dan posisinya di dalam properti.">
          <FormGrid columns={2}>
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
          </FormGrid>

          <FormGrid columns={2}>
            <Input
              label="Panjang"
              name="lengthM"
              type="number"
              min={0}
              step="0.1"
              rightAddon="m"
              inputClassName="text-right tabular-nums"
              defaultValue={initial?.lengthM ?? undefined}
              error={state.fieldErrors?.lengthM?.[0]}
            />
            <Input
              label="Lebar"
              name="widthM"
              type="number"
              min={0}
              step="0.1"
              rightAddon="m"
              inputClassName="text-right tabular-nums"
              defaultValue={initial?.widthM ?? undefined}
              error={state.fieldErrors?.widthM?.[0]}
            />
          </FormGrid>

          <Select
            name="roomTypeId"
            label="Tipe Kamar"
            placeholder="Tanpa tipe"
            allowEmpty
            className="sm:max-w-sm"
            value={roomTypeId}
            onValueChange={applyType}
            hint={
              roomTypes.length === 0
                ? 'Belum ada tipe di properti ini — buat dulu di menu Tipe Kamar.'
                : 'Tipe mengisi harga awal dan menyediakan fasilitas & foto bersama.'
            }
            options={roomTypes.map((type) => ({ value: type.id, label: type.name }))}
            error={state.fieldErrors?.roomTypeId?.[0]}
          />
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
            value={price}
            onValueChange={setPrice}
            error={state.fieldErrors?.price?.[0]}
          />

          <FormGrid columns={3}>
            {PRICE_TIER_FIELDS.map((tier) => (
              <CurrencyInput
                key={tier.field}
                label={tier.label}
                name={tier.field}
                value={tiers[tier.field]}
                onValueChange={(value) => setTiers((prev) => ({ ...prev, [tier.field]: value }))}
              />
            ))}
          </FormGrid>
        </FormCard>

        <FormCard
          title="Listrik"
          description="Menentukan apakah tagihan kamar ini punya baris listrik. Yang dipakai saat menagih adalah pilihan di kamar, bukan di tipe."
        >
          <RadioGroup
            name="electricityMode"
            label="Cara Pembayaran Listrik"
            options={ELECTRICITY_MODES.map((mode) => ({
              value: mode.value,
              label: mode.label,
              hint: mode.hint,
            }))}
            value={electricityMode}
            onValueChange={(value) => setElectricityMode(value as ElectricityMode)}
            error={state.fieldErrors?.electricityMode?.[0]}
          />

          {electricityMode === 'METERED' && (
            <p className="text-sm text-foreground-muted">
              Tarif per kWh diatur sekali untuk semua kamar di{' '}
              <span className="font-medium text-foreground">Sistem &rsaquo; Pengaturan</span>. Admin
              memasukkan pemakaian kWh di halaman tagihan tiap periode.
            </p>
          )}
        </FormCard>

        <FormCard title="Detail & Fasilitas" description="Tampil di halaman publik kamar.">
          <Textarea
            name="description"
            label="Deskripsi"
            hint={
              selectedType?.description
                ? `Dikosongkan berarti memakai deskripsi ${selectedType.name}.`
                : undefined
            }
            defaultValue={initial?.description ?? undefined}
          />

          {selectedType && !ownFacilities ? (
            <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised p-4">
              <p className="text-sm font-medium text-foreground">
                Fasilitas mengikuti tipe {selectedType.name}
              </p>
              <p className="text-sm text-foreground-muted">
                {selectedType.facilityIds.length > 0
                  ? facilities
                      .filter((facility) => selectedType.facilityIds.includes(facility.id))
                      .map((facility) => facility.name)
                      .join(', ')
                  : 'Tipe ini belum punya fasilitas.'}
              </p>
              <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setOwnFacilities(true)}>
                  Atur fasilitas khusus kamar ini
                </Button>
              </div>
            </div>
          ) : facilities.length > 0 ? (
            <div className="flex flex-col gap-3">
              <ChipGroup label="Fasilitas Kamar">
                {facilities.map((facility) => (
                  <ChipToggle
                    key={`${roomTypeId}-${facility.id}`}
                    name="facilityIds"
                    value={facility.id}
                    label={facility.name}
                    defaultChecked={initial?.facilityIds.includes(facility.id) ?? false}
                  />
                ))}
              </ChipGroup>
              {selectedType && (
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOwnFacilities(false)}
                  >
                    Kembali ikut fasilitas tipe {selectedType.name}
                  </Button>
                </div>
              )}
            </div>
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

function readTiers(prices?: { billingCycle: string; interval: number; price: number }[]): TierValues {
  if (!prices) return { ...EMPTY_TIERS };

  return PRICE_TIER_FIELDS.reduce((acc, tier) => {
    const match = prices.find(
      (p) => p.billingCycle === tier.billingCycle && p.interval === tier.interval,
    );
    return { ...acc, [tier.field]: match?.price ?? '' };
  }, { ...EMPTY_TIERS });
}
