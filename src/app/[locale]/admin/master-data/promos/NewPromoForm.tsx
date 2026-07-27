'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { createPromoAction, type PromoFormState } from './actions';

const initialState: PromoFormState = {};

export function NewPromoForm() {
  const [state, formAction, isPending] = useActionState(createPromoAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Judul Promo"
        name="title"
        required
        error={state.fieldErrors?.title?.[0]}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Mulai"
          name="startDate"
          type="date"
          required
          error={state.fieldErrors?.startDate?.[0]}
        />
        <Input
          label="Selesai"
          name="endDate"
          type="date"
          required
          error={state.fieldErrors?.endDate?.[0]}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground-muted">
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 rounded border-input" />
        Aktif
      </label>
      <Button type="submit" isLoading={isPending} className="self-start">
        Tambah Promo
      </Button>
    </form>
  );
}
