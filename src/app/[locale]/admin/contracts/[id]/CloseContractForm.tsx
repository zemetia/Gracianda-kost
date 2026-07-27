'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

import { closeContractAction, type CloseContractFormState } from '../actions';

const initialState: CloseContractFormState = {};

export function CloseContractForm({ contractId }: { contractId: string }) {
  const [state, formAction, isPending] = useActionState(
    closeContractAction.bind(null, contractId),
    initialState,
  );

  return (
    <form action={formAction} className="flex items-end gap-3">
      <Input
        label="Tanggal Keluar"
        name="actualEndDate"
        type="date"
        required
        error={state.fieldErrors?.actualEndDate?.[0]}
      />
      <Button type="submit" variant="destructive" isLoading={isPending}>
        Tutup Kontrak
      </Button>
    </form>
  );
}
