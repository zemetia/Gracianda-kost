'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { createFacilityAction, type FacilityFormState } from './actions';

const initialState: FacilityFormState = {};

export function NewFacilityForm() {
  const [state, formAction, isPending] = useActionState(createFacilityAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_13rem_minmax(0,1fr)_auto]">
        <Input
          label="Nama Fasilitas"
          name="name"
          placeholder="AC"
          required
          error={state.fieldErrors?.name?.[0]}
        />
        <Select
          label="Kategori"
          name="category"
          defaultValue="ROOM"
          options={[
            { value: 'ROOM', label: 'Fasilitas Kamar' },
            { value: 'COMMON', label: 'Fasilitas Umum' },
          ]}
          error={state.fieldErrors?.category?.[0]}
        />
        <Input
          label="Icon (opsional)"
          name="icon"
          placeholder="nama icon lucide, mis. snowflake"
          error={state.fieldErrors?.icon?.[0]}
        />
        <Button type="submit" size="lg" isLoading={isPending}>
          Tambah
        </Button>
      </div>

      <FormError message={state.error} />
    </form>
  );
}
