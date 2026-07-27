'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { addPartialPaymentAction, type AddPaymentFormState } from '../actions';

const initialState: AddPaymentFormState = {};

export function AddPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction, isPending] = useActionState(
    addPartialPaymentAction.bind(null, paymentId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Input
        label="Nominal"
        name="amount"
        type="number"
        min={1}
        step="0.01"
        required
        error={state.fieldErrors?.amount?.[0]}
      />
      <Input label="Metode" name="method" placeholder="Transfer BCA" error={state.fieldErrors?.method?.[0]} />
      <Input label="Catatan" name="note" error={state.fieldErrors?.note?.[0]} />
      <Button type="submit" isLoading={isPending}>
        Tambah Pembayaran
      </Button>
      {state.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
