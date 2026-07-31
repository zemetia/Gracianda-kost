'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

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
        <FormCard title="Kejadian" description="Apa yang terjadi dan kapan.">
          <FormGrid>
            <Select
              name="category"
              label="Kategori"
              required
              placeholder="Pilih kategori"
              options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
              error={state.fieldErrors?.category?.[0]}
            />
            <DatePicker
              label="Tanggal"
              name="date"
              required
              error={state.fieldErrors?.date?.[0]}
            />
          </FormGrid>

          <Textarea
            name="description"
            label="Deskripsi"
            rows={4}
            required
            placeholder="Kronologi singkat, siapa yang terlibat, tindakan yang sudah diambil."
            error={state.fieldErrors?.description?.[0]}
          />
        </FormCard>

        <FormCard title="Lokasi" description="Kamar dipilih kalau insiden terjadi di unit tertentu.">
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

            <Select
              name="roomId"
              label="Kamar / Unit"
              placeholder={selectedPropertyId ? 'Tidak terkait kamar/unit' : '—'}
              allowEmpty
              disabled={!selectedPropertyId}
              {...(selectedPropertyId ? {} : { hint: 'Pilih properti terlebih dahulu.' })}
              value={selectedRoomId}
              onValueChange={setSelectedRoomId}
              options={roomOptions}
            />

            <Input
              label="Lokasi Lain"
              name="location"
              className="sm:col-span-2"
              placeholder="Parkiran, Lobi, dst"
              hint="Isi kalau insiden tidak terjadi di dalam kamar."
              error={state.fieldErrors?.location?.[0]}
            />
          </FormGrid>
        </FormCard>

        <FormError message={state.error} />

        <FormStickyBar secondary="Laporan ini jadi dasar tindak lanjut — isi kronologi selagi masih segar.">
          <Button type="submit" isLoading={isPending}>
            Simpan Laporan
          </Button>
        </FormStickyBar>
      </FormLayout>
    </form>
  );
}
