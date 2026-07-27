'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createFacilityAction, type FacilityFormState } from './actions';

const initialState: FacilityFormState = {};

export function NewFacilityForm() {
  const [state, formAction, isPending] = useActionState(createFacilityAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Input
        label="Nama Fasilitas"
        name="name"
        placeholder="AC"
        required
        error={state.fieldErrors?.name?.[0]}
      />
      <Input
        label="Icon (opsional)"
        name="icon"
        placeholder="lucide icon name, mis. wind"
        error={state.fieldErrors?.icon?.[0]}
      />
      <Button type="submit" isLoading={isPending}>
        Tambah
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
