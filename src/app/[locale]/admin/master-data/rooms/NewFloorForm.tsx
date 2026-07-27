'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createFloorAction, type FloorFormState } from './actions';

const initialState: FloorFormState = {};

export function NewFloorForm({ propertyId }: { propertyId: string }) {
  const [state, formAction, isPending] = useActionState(createFloorAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="propertyId" value={propertyId} />
      
      <Input
        label="Nama Lantai"
        name="name"
        placeholder="Lantai 1"
        required
        error={state.fieldErrors?.name?.[0]}
      />
      <Input
        label="Urutan"
        name="order"
        type="number"
        min={0}
        defaultValue={0}
        required
        error={state.fieldErrors?.order?.[0]}
      />
      <Button type="submit" variant="secondary" isLoading={isPending}>
        Tambah Lantai
      </Button>
    </form>
  );
}
