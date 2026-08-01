'use client';

import { Trash2, UserPlus } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FormGrid } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GENDER_OPTIONS } from '@/lib/tenant';

export interface OccupantDraft {
  key: string;
  fullName: string;
  relation: string;
  gender: string;
  phone: string;
  ktpNumber: string;
  occupation: string;
  notes: string;
}

interface Props {
  occupants: OccupantDraft[];
  onChange: (occupants: OccupantDraft[]) => void;
}

function emptyOccupant(key: string): OccupantDraft {
  return {
    key,
    fullName: '',
    relation: '',
    gender: '',
    phone: '',
    ktpNumber: '',
    occupation: '',
    notes: '',
  };
}

/**
 * A repeatable list, not a comma-separated string: a room can hold two, three,
 * or more people, and each of them has their own identity that matters when
 * something happens in the room. Every row submits one value per field name, so
 * the Server Action rebuilds the rows by zipping `formData.getAll()` — the
 * hidden inputs behind Select always render, keeping the indexes aligned.
 */
export function OccupantsField({ occupants, onChange }: Props) {
  const idPrefix = useId();
  const [counter, setCounter] = useState(0);

  const add = () => {
    setCounter((current) => current + 1);
    onChange([...occupants, emptyOccupant(`${idPrefix}-${counter}`)]);
  };

  const remove = (key: string) => {
    onChange(occupants.filter((occupant) => occupant.key !== key));
  };

  const patch = (key: string, field: keyof OccupantDraft, value: string) => {
    onChange(
      occupants.map((occupant) => (occupant.key === key ? { ...occupant, [field]: value } : occupant)),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {occupants.length === 0 && (
        <p className="text-sm text-foreground-muted">
          Belum ada penghuni tambahan. Tambahkan bila kamar ini ditempati lebih dari satu orang.
        </p>
      )}

      {occupants.map((occupant, index) => (
        <div
          key={occupant.key}
          className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              Penghuni {index + 2}
              <span className="ml-2 font-normal text-foreground-muted">
                (penyewa utama = penghuni 1)
              </span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(occupant.key)}
              aria-label={`Hapus penghuni ${index + 2}`}
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>

          <FormGrid>
            <Input
              label="Nama Lengkap"
              name="occupantFullName"
              required
              value={occupant.fullName}
              onChange={(event) => patch(occupant.key, 'fullName', event.target.value)}
            />
            <Select
              label="Jenis Kelamin"
              name="occupantGender"
              placeholder="Pilih"
              allowEmpty
              options={GENDER_OPTIONS}
              value={occupant.gender}
              onValueChange={(next) => patch(occupant.key, 'gender', next)}
            />
            <Input
              label="Hubungan"
              name="occupantRelation"
              placeholder="Istri / Anak / Teman"
              value={occupant.relation}
              onChange={(event) => patch(occupant.key, 'relation', event.target.value)}
            />
            <Input
              label="Nomor HP"
              name="occupantPhone"
              value={occupant.phone}
              onChange={(event) => patch(occupant.key, 'phone', event.target.value)}
            />
            <Input
              label="Nomor KTP"
              name="occupantKtpNumber"
              value={occupant.ktpNumber}
              onChange={(event) => patch(occupant.key, 'ktpNumber', event.target.value)}
            />
            <Input
              label="Pekerjaan"
              name="occupantOccupation"
              value={occupant.occupation}
              onChange={(event) => patch(occupant.key, 'occupation', event.target.value)}
            />
            <Input
              label="Catatan"
              name="occupantNotes"
              className="sm:col-span-2"
              value={occupant.notes}
              onChange={(event) => patch(occupant.key, 'notes', event.target.value)}
            />
          </FormGrid>
        </div>
      ))}

      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <UserPlus aria-hidden className="size-4" />
          Tambah Penghuni
        </Button>
      </div>
    </div>
  );
}
