'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormCard, FormError, FormGrid, FormLayout, FormStickyBar } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { INCIDENT_CATEGORY_OPTIONS } from '@/lib/incident';
import type { IncidentPersonCandidate } from '@/services/incident.service';

import { createIncidentAction, type IncidentFormState } from './actions';
import { IncidentPeopleField, type IncidentPersonDraft } from './IncidentPeopleField';

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

const initialState: IncidentFormState = {};

export function IncidentForm({
  properties,
  rooms,
  candidates,
  initialPropertyId,
  initialRoomId,
}: {
  properties: Property[];
  rooms: Room[];
  candidates: IncidentPersonCandidate[];
  initialPropertyId?: string | undefined;
  initialRoomId?: string | undefined;
}) {
  const [state, formAction, isPending] = useActionState(createIncidentAction, initialState);
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId ?? '');
  // Controlled so switching property drops a room that no longer belongs to it.
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId ?? '');
  const [people, setPeople] = useState<IncidentPersonDraft[]>([]);

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
              options={INCIDENT_CATEGORY_OPTIONS}
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
            placeholder="Kronologi singkat dan tindakan yang sudah diambil."
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

        <FormCard
          title="Orang Terkait"
          description="Siapa saja yang terlibat, melapor, atau melihat kejadian ini."
        >
          <IncidentPeopleField
            people={people}
            onChange={setPeople}
            candidates={candidates}
            propertyId={selectedPropertyId}
            roomId={selectedRoomId}
          />
          {state.fieldErrors?.people?.[0] && (
            <p className="text-sm text-destructive">{state.fieldErrors.people[0]}</p>
          )}
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
