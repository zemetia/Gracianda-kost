'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { FormError, FormGrid } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';

import { addPartialPaymentAction, type AddPaymentFormState } from '../actions';

const initialState: AddPaymentFormState = {};

export function AddPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction, isPending] = useActionState(
    addPartialPaymentAction.bind(null, paymentId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormGrid columns={3}>
        <CurrencyInput
          label="Nominal"
          name="amount"
          required
          error={state.fieldErrors?.amount?.[0]}
        />
        <Input label="Metode" name="method" placeholder="Transfer BCA" error={state.fieldErrors?.method?.[0]} />
        <Input label="Catatan" name="note" error={state.fieldErrors?.note?.[0]} />
      </FormGrid>

      <FormError message={state.error} />

      <Button type="submit" isLoading={isPending} className="self-start">
        Tambah Pembayaran
      </Button>
    </form>
  );
}
