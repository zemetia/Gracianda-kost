'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

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

const SCOPES = [
  { value: 'ROOM' as const, label: 'Per Kamar / Unit' },
  { value: 'BUILDING' as const, label: 'Seluruh Properti' },
];

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
  // Controlled so switching property drops a room that no longer belongs to it.
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId ?? '');

  const roomOptions = rooms
    .filter((room) => room.propertyId === selectedPropertyId)
    .map((room) => ({
      value: room.id,
      label: `No. ${room.number}`,
      ...(room.floor ? { hint: room.floor.name } : {}),
    }));

  return (
    <form action={formAction}>
      <FormLayout>
        <FormCard
          title="Lingkup Perawatan"
          description="Biaya per kamar masuk ke laporan kamar itu; biaya gedung dibagi ke seluruh properti."
        >
          <SegmentedControl
            name="scope"
            label="Lingkup"
            options={SCOPES}
            value={scope}
            onValueChange={setScope}
          />

          <FormGrid>
            <Select
              name="propertyId"
              label="Properti"
              required
              placeholder="Pilih properti"
              value={selectedPropertyId}
              onValueChange={(next) => {
                setSelectedPropertyId(next);
                setSelectedRoomId('');
              }}
              options={properties.map((property) => ({ value: property.id, label: property.name }))}
              error={state.fieldErrors?.propertyId?.[0]}
            />

            {scope === 'ROOM' && (
              <Select
                name="roomId"
                label="Kamar / Unit"
                required
                placeholder={selectedPropertyId ? 'Pilih kamar/unit' : '—'}
                disabled={!selectedPropertyId}
                {...(selectedPropertyId ? {} : { hint: 'Pilih properti terlebih dahulu.' })}
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
                options={roomOptions}
                error={state.fieldErrors?.roomId?.[0]}
              />
            )}
          </FormGrid>
        </FormCard>

        <FormCard title="Detail Pekerjaan" description="Kategori dan biaya masuk ke laporan maintenance.">
          <FormGrid>
            <div className="flex w-full min-w-0 flex-col">
              <Input
                name="category"
                label="Kategori"
                list="maintenance-categories"
                required
                placeholder="Perbaikan AC, Cat ulang, …"
                error={state.fieldErrors?.category?.[0]}
              />
              <datalist id="maintenance-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>

            <DatePicker label="Tanggal" name="date" required error={state.fieldErrors?.date?.[0]} />
            <CurrencyInput label="Biaya" name="cost" error={state.fieldErrors?.cost?.[0]} />
            <Input label="Vendor" name="vendor" error={state.fieldErrors?.vendor?.[0]} />
          </FormGrid>

          <Textarea name="notes" label="Catatan" />
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar>
          <Button type="submit" isLoading={isPending}>
            Simpan Catatan
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
