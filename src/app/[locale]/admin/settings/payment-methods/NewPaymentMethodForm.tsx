'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { createPaymentMethodAction, type PaymentMethodFormState } from './actions';

const initialState: PaymentMethodFormState = {};

const TYPE_OPTIONS = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'BANK', label: 'Rekening Bank' },
  { value: 'EWALLET', label: 'E-Wallet' },
];

export function NewPaymentMethodForm() {
  const [state, formAction, isPending] = useActionState(createPaymentMethodAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[minmax(0,1fr)_13rem_auto]">
        <Input
          label="Nama Metode"
          name="name"
          placeholder="BCA - Budi Santoso"
          required
          error={state.fieldErrors?.name?.[0]}
        />
        <Select
          label="Tipe"
          name="type"
          defaultValue="CASH"
          options={TYPE_OPTIONS}
          error={state.fieldErrors?.type?.[0]}
        />
        <Button type="submit" size="lg" isLoading={isPending}>
          Tambah
        </Button>
      </div>

      <FormError message={state.error} />
    </form>
  );
}
