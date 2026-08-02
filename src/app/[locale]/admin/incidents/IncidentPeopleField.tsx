'use client';

import { Trash2, UserPlus } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormGrid } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { INCIDENT_PERSON_ROLE_OPTIONS } from '@/lib/incident';
import type { IncidentPersonCandidate } from '@/services/incident.service';

export interface IncidentPersonDraft {
  key: string;
  ref: string;
  role: string;
  name: string;
  phone: string;
  notes: string;
}

interface Props {
  people: IncidentPersonDraft[];
  onChange: (people: IncidentPersonDraft[]) => void;
  candidates: IncidentPersonCandidate[];
  /** Narrows the picker; people of `roomId` are listed first. */
  propertyId: string;
  roomId: string;
}

function emptyPerson(key: string): IncidentPersonDraft {
  return { key, ref: '', role: 'TERLIBAT', name: '', phone: '', notes: '' };
}

/**
 * People are a repeatable list, not a sentence inside the description: an
 * incident that names its people is the only way "sudah pernah bikin masalah
 * sebelumnya?" can be answered from data instead of memory. Picking a
 * registered occupant links the row to that person; leaving the picker empty
 * still records the row by name, because outsiders (guests, couriers,
 * neighbours) show up in incidents too and must not be unrecordable.
 *
 * Every row submits one value per field name, so the Server Action rebuilds the
 * rows by zipping `formData.getAll()` — the hidden inputs behind Select and
 * Combobox always render, keeping the indexes aligned.
 */
export function IncidentPeopleField({
  people,
  onChange,
  candidates,
  propertyId,
  roomId,
}: Props) {
  const idPrefix = useId();
  const [counter, setCounter] = useState(0);

  const scoped = candidates.filter(
    (candidate) => !propertyId || candidate.propertyId === propertyId,
  );
  // Room occupants first: they are who an in-room incident is almost always about.
  const ordered = roomId
    ? [
        ...scoped.filter((candidate) => candidate.roomId === roomId),
        ...scoped.filter((candidate) => candidate.roomId !== roomId),
      ]
    : scoped;

  const options = ordered.map((candidate) => ({
    value: candidate.ref,
    label: candidate.name,
    hint: `Kamar ${candidate.roomNumber} · ${
      candidate.kind === 'tenant' ? 'Penyewa' : 'Penghuni tambahan'
    }`,
  }));

  const add = () => {
    setCounter((current) => current + 1);
    onChange([...people, emptyPerson(`${idPrefix}-${counter}`)]);
  };

  const remove = (key: string) => {
    onChange(people.filter((person) => person.key !== key));
  };

  const patch = (key: string, patchValue: Partial<IncidentPersonDraft>) => {
    onChange(people.map((person) => (person.key === key ? { ...person, ...patchValue } : person)));
  };

  // Picking a registered person fills the name/phone so the row stays readable
  // even after that tenant moves out and the link goes stale.
  const pick = (key: string, ref: string) => {
    const candidate = candidates.find((item) => item.ref === ref);
    patch(key, {
      ref,
      ...(candidate ? { name: candidate.name, phone: candidate.phone ?? '' } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {people.length === 0 && (
        <p className="text-sm text-foreground-muted">
          Belum ada orang dicatat. Tambahkan pelapor, yang terlibat, atau saksi — nama di sini yang
          bisa dilacak lagi nanti, bukan nama di dalam deskripsi.
        </p>
      )}

      {people.map((person, index) => (
        <div
          key={person.key}
          className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Orang {index + 1}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(person.key)}
              aria-label={`Hapus orang ${index + 1}`}
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>

          <FormGrid>
            <Select
              label="Peran"
              name="personRole"
              options={INCIDENT_PERSON_ROLE_OPTIONS}
              value={person.role}
              onValueChange={(next) => patch(person.key, { role: next })}
            />
            <Combobox
              label="Penghuni Terdaftar"
              name="personRef"
              options={options}
              value={person.ref}
              onValueChange={(next) => pick(person.key, next)}
              placeholder="Cari nama penghuni"
              emptyText="Tidak ada penghuni cocok — isi namanya manual di bawah."
              hint="Kosongkan kalau orangnya bukan penghuni (tamu, kurir, orang luar)."
            />
            <Input
              label="Nama"
              name="personName"
              required
              value={person.name}
              onChange={(event) => patch(person.key, { name: event.target.value })}
            />
            <Input
              label="Nomor HP"
              name="personPhone"
              value={person.phone}
              onChange={(event) => patch(person.key, { phone: event.target.value })}
            />
            <Input
              label="Catatan"
              name="personNotes"
              className="sm:col-span-2"
              placeholder="Perannya di kejadian ini, kesepakatan yang dibuat, dst"
              value={person.notes}
              onChange={(event) => patch(person.key, { notes: event.target.value })}
            />
          </FormGrid>
        </div>
      ))}

      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <UserPlus aria-hidden className="size-4" />
          Tambah Orang
        </Button>
      </div>
    </div>
  );
}
