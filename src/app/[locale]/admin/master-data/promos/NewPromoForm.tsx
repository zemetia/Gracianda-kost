'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { DatePicker } from '@/components/ui/DatePicker';
import { FormError } from '@/components/ui/Form';
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
        <DatePicker
          label="Mulai"
          name="startDate"
          required
          error={state.fieldErrors?.startDate?.[0]}
        />
        <DatePicker
          label="Selesai"
          name="endDate"
          required
          error={state.fieldErrors?.endDate?.[0]}
        />
      </div>
      <Checkbox name="isActive" defaultChecked label="Aktif" />

      <FormError message={state.error} />

      <Button type="submit" isLoading={isPending} className="self-start">
        Tambah Promo
      </Button>
    </form>
  );
}
